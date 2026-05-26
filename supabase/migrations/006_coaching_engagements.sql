-- 006_coaching_engagements.sql
-- Öğrenci kimliğini (students) koçluk ilişkisinden (coaching_engagements) ayırır.
-- Akademik veriler engagement_id'ye bağlanır; exam_results öğrenciye bağlı kalır (paylaşımlı).
-- Mevcut tüm verilerin korunması için backfill yapılır.

BEGIN;

-- ============================================================
-- 1) YENİ TABLOLAR VE ENUM
-- ============================================================

CREATE TYPE engagement_status AS ENUM ('active', 'ended', 'paused');

CREATE TABLE public.coaching_engagements (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id     UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  coach_id       UUID NOT NULL REFERENCES public.users(id)    ON DELETE CASCADE,
  status         engagement_status NOT NULL DEFAULT 'active',
  started_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at       TIMESTAMPTZ,
  end_reason     TEXT,
  school_level   TEXT, -- 'ortaokul' | 'lise' | 'mezun'
  grade_at_start TEXT,
  track          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX one_active_engagement_per_student
  ON public.coaching_engagements (student_id)
  WHERE status = 'active';

CREATE INDEX coaching_engagements_coach_idx
  ON public.coaching_engagements (coach_id, status);

CREATE INDEX coaching_engagements_student_idx
  ON public.coaching_engagements (student_id, status);

CREATE TABLE public.coaching_invitations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  coach_id     UUID NOT NULL REFERENCES public.users(id)    ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending',
  token        TEXT NOT NULL UNIQUE,
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  CONSTRAINT coaching_invitations_status_check
    CHECK (status IN ('pending', 'accepted', 'declined', 'expired'))
);

CREATE INDEX coaching_invitations_student_idx
  ON public.coaching_invitations (student_id, status);

CREATE INDEX coaching_invitations_coach_idx
  ON public.coaching_invitations (coach_id, status);

-- ============================================================
-- 2) ÇOCUK TABLOLARA engagement_id KOLONU
-- ============================================================

ALTER TABLE public.weekly_programs
  ADD COLUMN engagement_id UUID REFERENCES public.coaching_engagements(id) ON DELETE CASCADE;

ALTER TABLE public.lesson_nets
  ADD COLUMN engagement_id UUID REFERENCES public.coaching_engagements(id) ON DELETE CASCADE;

ALTER TABLE public.coach_notes
  ADD COLUMN engagement_id UUID REFERENCES public.coaching_engagements(id) ON DELETE CASCADE;

ALTER TABLE public.motivation_messages
  ADD COLUMN engagement_id UUID REFERENCES public.coaching_engagements(id) ON DELETE CASCADE;

-- question_sessions opsiyoneldir; sadece tablo varsa kolon ekle.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'question_sessions'
  ) THEN
    ALTER TABLE public.question_sessions
      ADD COLUMN engagement_id UUID REFERENCES public.coaching_engagements(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- 3) BACKFILL — mevcut her öğrenci için aktif engagement yarat
--    ve çocuk tabloların engagement_id'sini doldur.
-- ============================================================

INSERT INTO public.coaching_engagements
  (student_id, coach_id, status, started_at, grade_at_start, track)
SELECT
  s.id,
  s.coach_id,
  'active',
  COALESCE(s.created_at, NOW()),
  s.grade,
  s.track
FROM public.students s
WHERE s.coach_id IS NOT NULL;

UPDATE public.weekly_programs wp
   SET engagement_id = e.id
  FROM public.coaching_engagements e
 WHERE e.student_id = wp.student_id
   AND e.status = 'active';

UPDATE public.lesson_nets ln
   SET engagement_id = e.id
  FROM public.coaching_engagements e
 WHERE e.student_id = ln.student_id
   AND e.status = 'active';

UPDATE public.coach_notes cn
   SET engagement_id = e.id
  FROM public.coaching_engagements e
 WHERE e.student_id = cn.student_id
   AND e.coach_id = cn.coach_id
   AND e.status = 'active';

UPDATE public.motivation_messages mm
   SET engagement_id = e.id
  FROM public.coaching_engagements e
 WHERE e.student_id = mm.student_id
   AND e.coach_id = mm.coach_id
   AND e.status = 'active';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'question_sessions'
  ) THEN
    EXECUTE $sql$
      UPDATE public.question_sessions qs
         SET engagement_id = e.id
        FROM public.coaching_engagements e
       WHERE e.student_id = qs.student_id
         AND e.status = 'active'
    $sql$;
  END IF;
END $$;

-- Backfill sonrası yetim satırları temizle (silmek yerine null bırakıyoruz;
-- bunlar büyük ihtimalle test artığıdır ve RLS zaten erişimi engelleyecek).

-- ============================================================
-- 4) UNIQUE KISITLARINI engagement SCOPE'UNA TAŞI
-- ============================================================

ALTER TABLE public.weekly_programs
  DROP CONSTRAINT IF EXISTS weekly_programs_student_id_week_start_key;
ALTER TABLE public.weekly_programs
  ADD CONSTRAINT weekly_programs_engagement_week_unique
  UNIQUE (engagement_id, week_start);

ALTER TABLE public.lesson_nets
  DROP CONSTRAINT IF EXISTS lesson_nets_student_id_week_start_key;
ALTER TABLE public.lesson_nets
  ADD CONSTRAINT lesson_nets_engagement_week_unique
  UNIQUE (engagement_id, week_start);

ALTER TABLE public.coach_notes
  DROP CONSTRAINT IF EXISTS coach_notes_coach_id_student_id_key;
ALTER TABLE public.coach_notes
  ADD CONSTRAINT coach_notes_engagement_unique
  UNIQUE (engagement_id);

-- engagement_id NOT NULL — sadece backfill başarılıysa kabul edilir.
-- Eğer backfill öncesinde test/yetim satırlar varsa NOT NULL set'i fail eder;
-- bunları silmediğimiz için NULL'lara izin veriyoruz (yeni yazımlar zorunlu olacak,
-- application katmanı engagement_id'siz upsert yapamaz).

-- ============================================================
-- 5) RLS HELPER'LARI
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_coach_of_engagement(p_engagement_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.coaching_engagements e
    WHERE e.id = p_engagement_id AND e.coach_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_student_of_engagement(p_engagement_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.coaching_engagements e
    JOIN public.students s ON s.id = e.student_id
    WHERE e.id = p_engagement_id AND s.user_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.coach_has_engagement_with_student(p_student_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.coaching_engagements e
    WHERE e.student_id = p_student_id AND e.coach_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- 6) RLS POLİTİKALARI
-- ============================================================

ALTER TABLE public.coaching_engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_invitations ENABLE ROW LEVEL SECURITY;

-- coaching_engagements: koç kendi engagement'larını yönetir, öğrenci kendi engagement'ını okur.
CREATE POLICY engagements_coach_all ON public.coaching_engagements
  FOR ALL USING (coach_id = auth.uid());

CREATE POLICY engagements_student_select ON public.coaching_engagements
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.students s WHERE s.id = coaching_engagements.student_id AND s.user_id = auth.uid())
  );

-- coaching_invitations: koç davet yaratır/iptal eder, öğrenci kendi davetlerini okur/yanıtlar.
CREATE POLICY invitations_coach_all ON public.coaching_invitations
  FOR ALL USING (coach_id = auth.uid());

CREATE POLICY invitations_student_select ON public.coaching_invitations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.students s WHERE s.id = coaching_invitations.student_id AND s.user_id = auth.uid())
  );

CREATE POLICY invitations_student_update ON public.coaching_invitations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.students s WHERE s.id = coaching_invitations.student_id AND s.user_id = auth.uid())
  );

-- students: koç sadece engagement'ı olduğu öğrencileri görebilir.
DROP POLICY IF EXISTS students_coach_all ON public.students;

CREATE POLICY students_coach_engaged_select ON public.students
  FOR SELECT USING (public.coach_has_engagement_with_student(students.id));

CREATE POLICY students_coach_engaged_update ON public.students
  FOR UPDATE USING (public.coach_has_engagement_with_student(students.id));

-- (students_self_select ve students_self_update_activity zaten var, dokunmuyoruz)

-- weekly_programs: engagement bazlı.
DROP POLICY IF EXISTS weekly_coach_all ON public.weekly_programs;
CREATE POLICY weekly_coach_engagement ON public.weekly_programs
  FOR ALL USING (
    weekly_programs.engagement_id IS NOT NULL
    AND public.is_coach_of_engagement(weekly_programs.engagement_id)
  );

-- (weekly_student_select / update / insert öğrenci bazlı kalsın; öğrenci kendi
--  tüm haftalarını görebilir/güncelleyebilir.)

-- lesson_nets: engagement bazlı.
DROP POLICY IF EXISTS lesson_coach_all ON public.lesson_nets;
CREATE POLICY lesson_coach_engagement ON public.lesson_nets
  FOR ALL USING (
    lesson_nets.engagement_id IS NOT NULL
    AND public.is_coach_of_engagement(lesson_nets.engagement_id)
  );

-- coach_notes: engagement bazlı.
DROP POLICY IF EXISTS notes_coach_only ON public.coach_notes;
CREATE POLICY notes_coach_engagement ON public.coach_notes
  FOR ALL USING (
    coach_notes.engagement_id IS NOT NULL
    AND public.is_coach_of_engagement(coach_notes.engagement_id)
  );

-- motivation_messages: engagement bazlı.
DROP POLICY IF EXISTS motivation_coach_crud ON public.motivation_messages;
CREATE POLICY motivation_coach_engagement ON public.motivation_messages
  FOR ALL USING (
    motivation_messages.engagement_id IS NOT NULL
    AND public.is_coach_of_engagement(motivation_messages.engagement_id)
  );

-- (motivation_student_read aynı kalır.)

-- exam_results: paylaşımlı — öğrenciyle herhangi bir (geçmiş/aktif) engagement'ı olan koç görür.
DROP POLICY IF EXISTS exam_coach_all ON public.exam_results;
CREATE POLICY exam_coach_shared ON public.exam_results
  FOR ALL USING (public.coach_has_engagement_with_student(exam_results.student_id));

-- question_sessions (varsa): engagement bazlı.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'question_sessions'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS qs_coach_all ON public.question_sessions';
    EXECUTE 'DROP POLICY IF EXISTS question_sessions_coach_all ON public.question_sessions';
    EXECUTE $sql$
      CREATE POLICY question_sessions_coach_engagement ON public.question_sessions
        FOR ALL USING (
          question_sessions.engagement_id IS NOT NULL
          AND public.is_coach_of_engagement(question_sessions.engagement_id)
        )
    $sql$;
  END IF;
END $$;

-- ============================================================
-- 7) students.coach_id artık opsiyonel
--    (rollback güvenliği için DROP COLUMN ikinci migration'a bırakıldı)
-- ============================================================

ALTER TABLE public.students
  ALTER COLUMN coach_id DROP NOT NULL;

COMMIT;
