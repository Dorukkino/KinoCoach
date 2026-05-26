-- 007_drop_students_coach_id.sql
-- 006_coaching_engagements'tan sonra uygulanır. Engagement tabanlı modele
-- tamamen geçildikten sonra eski `students.coach_id` kolonunu, ona bağlı
-- helper'ı ve geriye kalan eski RLS politikalarını kaldırır.
-- Bu migration'ı SADECE uygulama kodu güncellenip doğrulandıktan sonra çalıştırın.

BEGIN;

-- ============================================================
-- 1) Eski helper'ı sil.
-- ============================================================
DROP FUNCTION IF EXISTS public.is_coach_of_student(UUID);

-- ============================================================
-- 2) students.coach_id'e hâlâ bağlı kalan eski RLS politikalarını
--    temizle. 006 migration'ı bazı isimleri kapsamamıştı; burada
--    pg_depend'in bildirdiği üç politikayı isim isim ele alıyoruz.
-- ============================================================

-- 2a) question_sessions: koç-tarafı eski politika. Engagement bazlı
--     yeni politika (question_sessions_coach_engagement) 006'da yaratıldı,
--     bu yüzden sadece eski olanı bırakıyoruz.
DROP POLICY IF EXISTS "coach sees student sessions" ON public.question_sessions;

-- 2b) coach_lessons: öğrenci-tarafı SELECT/INSERT politikalarını
--     aktif engagement üzerinden çalışacak şekilde yeniden yarat.
DROP POLICY IF EXISTS "student sees coach lessons" ON public.coach_lessons;
DROP POLICY IF EXISTS "student inserts coach lessons" ON public.coach_lessons;

CREATE POLICY "student sees coach lessons" ON public.coach_lessons
  FOR SELECT USING (
    coach_id IN (
      SELECT e.coach_id
        FROM public.coaching_engagements e
        JOIN public.students s ON s.id = e.student_id
       WHERE s.user_id = auth.uid()
         AND e.status = 'active'
    )
  );

CREATE POLICY "student inserts coach lessons" ON public.coach_lessons
  FOR INSERT WITH CHECK (
    coach_id IN (
      SELECT e.coach_id
        FROM public.coaching_engagements e
        JOIN public.students s ON s.id = e.student_id
       WHERE s.user_id = auth.uid()
         AND e.status = 'active'
    )
  );

-- ============================================================
-- 3) `students.coach_id` kolonunu sil. Mevcut tüm engagement verileri
--    coaching_engagements tablosunda korunur. FK kısıtı kolonla
--    birlikte otomatik düşer.
-- ============================================================
ALTER TABLE public.students
  DROP COLUMN IF EXISTS coach_id;

COMMIT;
