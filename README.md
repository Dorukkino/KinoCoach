# KinoCoach

KinoCoach, YKS koçları için geliştirilmiş çok rollü bir koçluk SaaS uygulamasıdır. Koçlar öğrencilerini, haftalık programları, deneme netlerini, soru çözüm takibini, notları ve chat iletişimini tek panelden yönetir; öğrenciler kendi programlarını ve gelişimlerini takip eder; admin paneli ise platform genelindeki kullanıcı, davet ve koç-öğrenci ilişkilerini yönetir.

Proje Next.js App Router, Supabase ve Clean Architecture yaklaşımı üzerine kuruludur.

## Öne Çıkan Özellikler

- Koç, öğrenci ve admin rolleri için ayrı panel ve yetki akışları.
- Koç kayıt, giriş, şifre sıfırlama ve Supabase Auth tabanlı oturum yönetimi.
- Koçların öğrenci hesabı oluşturması veya mevcut öğrenciyi davet etmesi.
- Öğrenci listesi, öğrenci detay ekranı, koç notları ve motivasyon mesajları.
- 7x10 haftalık program tablosu ve öğrenci tarafından görev tamamlama takibi.
- Deneme sonuçları, branş netleri ve gelişim grafikleri.
- Soru çözüm / ders netleri takibi.
- Koç-öğrenci chat sistemi, okunmamış mesaj sayacı ve dosya eki desteği.
- Supabase Realtime ile dashboard, chat, bildirim ve öğrenci verilerinde canlı güncellemeler.
- SMTP üzerinden davet, bildirim ve iletişim e-postaları.
- Vercel cron ile haftalık hatırlatma endpoint'i.
- Admin panelinde kullanıcı, davet, ilişki ve platform metrikleri yönetimi.

## Tech Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Supabase Auth, PostgreSQL, RLS, Realtime ve Storage
- Nodemailer SMTP
- Recharts
- Vitest
- Vercel cron

## Mimari

Kod tabanı katmanlı bir yapıda düzenlenmiştir:

```text
src/
  app/             Next.js route'ları, layout'lar, server action'lar ve API route'ları
  domain/          Entity, value object, domain service ve domain error'ları
  application/     Use case'ler, port arayüzleri, DTO'lar ve uygulama servisleri
  infrastructure/  Supabase repository'leri, auth, storage, email, cache, query ve DI
  presentation/    React UI bileşenleri, layout, hook, provider ve skeleton'lar
  lib/             Paylaşılan yardımcı fonksiyonlar

supabase/
  migrations/      Veritabanı, RLS, realtime, storage ve admin panel migration'ları
  KURULUM.md       Supabase kurulum notları

testsprite_tests/  TestSprite tarafından üretilmiş uçtan uca test senaryoları ve rapor
```

Bağımlılıklar `src/infrastructure/di/container.ts` içinde birleştirilir. Route ve server action katmanı doğrudan iş kuralı yazmak yerine application use case'lerini kullanır. Supabase erişimi repository ve query sınıfları üzerinden yapılır.

## Rol ve Yetki Akışı

- Public sayfalar: `/`, `/hakkimizda`, `/iletisim`, yasal sayfalar, `/login`, `/register`, `/forgot-password`, `/auth/callback`, `/auth/update-password`.
- Middleware oturum varlığını kontrol eder ve public/auth yönlendirmelerini yapar.
- Rol bazlı guard'lar layout seviyesindedir:
  - `/coach/*` sadece koçlara açıktır.
  - `/student/*` sadece öğrencilere açıktır.
  - `/admin/*` sadece admin rolüne açıktır.
- Public kayıt akışı sadece koç hesabı oluşturur.
- Öğrenci ve admin hesapları server-side Admin API / service role akışları ile oluşturulur.

## Kurulum

Gereksinimler:

- Node.js 20 veya güncel LTS sürümü
- npm
- Supabase projesi
- SMTP hesabı

Adımlar:

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Windows PowerShell kullanıyorsanız `.env.local` dosyasını şu şekilde oluşturabilirsiniz:

```powershell
Copy-Item .env.local.example .env.local
```

Uygulama varsayılan olarak `http://localhost:3000` adresinde çalışır.

## Ortam Değişkenleri

`.env.local.example` dosyasını `.env.local` olarak kopyalayın ve değerleri kendi ortamınıza göre doldurun.

Zorunlu değişkenler:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SMTP_HOST=
SMTP_PORT=
SMTP_SECURE=
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=
CRON_SECRET=
```

Önerilen veya opsiyonel değişkenler:

```env
NEXT_PUBLIC_SITE_URL=
CONTACT_EMAIL=
CRON_SECRET=
PERF_LOGGING=
BACKGROUND_BATCH_CONCURRENCY=
```

Notlar:

- `SUPABASE_SERVICE_ROLE_KEY` sadece server tarafında kullanılmalıdır; client'a sızdırılmamalıdır.
- `NEXT_PUBLIC_SITE_URL`, davet ve şifre sıfırlama linkleri için production ortamında tanımlanmalıdır.
- `CONTACT_EMAIL` yoksa iletişim formu alıcısı olarak `EMAIL_FROM` kullanılır.
- `/api/cron/weekly-reminders` endpoint'i `Authorization: Bearer <CRON_SECRET>` bekler.
- `PERF_LOGGING=1` bazı server action performans ölçümlerini loglar.

## Supabase Kurulumu

Detaylı Türkçe kurulum rehberi için `supabase/KURULUM.md` dosyasını takip edin.

Yeni bir Supabase projesinde `supabase/migrations/` altındaki SQL dosyalarını numara sırasıyla uygulayın:

```text
001_initial_schema.sql
002_storage_chat.sql
003_fix_student_user_trigger.sql
004_backfill_users_from_auth.sql
005_question_sessions_note.sql
006_coaching_engagements.sql
007_drop_students_coach_id.sql
008_enable_realtime_for_live_updates.sql
009_multi_coach_notes.sql
010_performance_indexes.sql
010_question_sessions_weeks_fn.sql
011_performance_indexes.sql
012_fast_indexes.sql
013_messages_realtime.sql
014_question_session_weeks_isoweek.sql
015_notifications_schema.sql
016_notifications_delete_policy.sql
017_exam_results_student_mutations.sql
018_chat_message_read_receipts.sql
019_performance_optimizations.sql
020_admin_panel.sql
021_admin_panel_schema.sql
```

`002_storage_chat.sql`, chat dosya ekleri için `chat-attachments` bucket'ını ve ilgili storage policy'lerini hazırlar. Dosya eki özelliğini kullanmayacaksanız bu migration atlanabilir, ancak uygulamanın tam özellik seti için önerilir.

## Kullanılabilir Scriptler

```bash
npm run dev          # Geliştirme sunucusu
npm run build        # Production build
npm run start        # Production sunucusu
npm run lint         # Lint kontrolü
npm run test         # Vitest testleri
npm run test:watch   # Vitest watch modu
```

## Ana Sayfalar

Public:

- `/` landing page
- `/login`
- `/register`
- `/forgot-password`
- `/auth/update-password`
- `/hakkimizda`
- `/iletisim`
- `/gizlilik-politikasi`
- `/kullanim-sartlari`
- `/kvkk`
- `/cerez-politikasi`

Koç:

- `/coach/dashboard`
- `/coach/students`
- `/coach/students/[id]`
- `/coach/notes`
- `/coach/chat`
- `/coach/weekly`
- `/coach/exams`
- `/coach/lesson-nets`

Öğrenci:

- `/student/dashboard`
- `/student/weekly`
- `/student/exams`
- `/student/lesson-nets`
- `/student/chat`

Admin:

- `/admin/login`
- `/admin/dashboard`
- `/admin/users`
- `/admin/invitations`
- `/admin/engagements`

## Test ve Kalite

Birim testleri Vitest ile çalışır:

```bash
npm run test
```

Mevcut test kapsamı özellikle domain servisleri için başlamıştır. `testsprite_tests/` klasöründe TestSprite tarafından oluşturulmuş uçtan uca test senaryoları ve raporlar bulunur; bunlar ürün akışlarını doğrulamak için referans olarak kullanılabilir.

## Deploy

Proje Vercel üzerinde Next.js olarak deploy edilecek şekilde yapılandırılmıştır. `vercel.json` içinde haftalık hatırlatmalar için cron tanımı vardır:

```json
{
  "path": "/api/cron/weekly-reminders",
  "schedule": "0 6 * * *"
}
```

Production ortamında Vercel Environment Variables bölümüne `.env.local` içindeki değerleri ekleyin. Cron endpoint'inin çalışması için `CRON_SECRET` tanımlı olmalı ve istekler bearer token ile gelmelidir.

## Referans Tasarımlar

- `Kino Saas/`: İlk arayüz prototipi ve referans ekranlar.
- `KinoCoachTasarım/`: PNG formatındaki tasarım referansları.
- `public/logo.png` ve `public/logo2.png`: Uygulama logoları.

## Geliştirme Notları

- TypeScript strict mode aktiftir.
- `@/*`, `@/domain/*`, `@/application/*`, `@/infrastructure/*` ve `@/presentation/*` alias'ları `tsconfig.json` içinde tanımlıdır.
- `Kino Saas` klasörü TypeScript derlemesinden hariç tutulmuştur.
- Yeni iş kuralları mümkün olduğunca `application/use-cases` altında modellenmeli; UI ve route katmanı ince tutulmalıdır.
- Supabase RLS policy'leri uygulamanın güvenlik modelinin parçasıdır. Schema değişikliklerinde migration dosyası ekleyin ve ilgili policy'leri gözden geçirin.
