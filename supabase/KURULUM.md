# Supabase veritabanı kurulumu

Tablolar repoda hazır; **Supabase projenizde SQL olarak çalıştırmanız** gerekiyor.

## 1. Supabase projesi

1. [https://supabase.com/dashboard](https://supabase.com/dashboard) → projenizi açın (veya yeni proje oluşturun).
2. **Settings → API** bölümünden şunları `.env.local` dosyanıza kopyalayın:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (gizli tutun)

## 2. Tabloları oluşturma (zorunlu)

1. Sol menüden **SQL Editor** → **New query**
2. Bilgisayarınızdaki şu dosyanın **tüm içeriğini** kopyalayıp yapıştırın:

   `supabase/migrations/001_initial_schema.sql`

3. **Run** (veya Ctrl+Enter)
4. Başarılı olunca **Table Editor**'da şu tabloları görmelisiniz:
   - `users`
   - `students`
   - `weekly_programs`
   - `exam_results`
   - `messages`
   - `coach_notes`
   - `motivation_messages`
   - `lesson_nets`

Hata alırsanız:
- `type "user_role" already exists` → Tablolar zaten var; bu adımı atlayın veya projede sıfırdan DB kullanın.
- `relation "users" already exists` → Aynı şekilde migration zaten uygulanmış.

## 3. Öğrenci ekleme düzeltmesi (001 çalıştırdıysanız zorunlu)

`Database error creating new user` hatası alıyorsanız SQL Editor'de çalıştırın:

`supabase/migrations/003_fix_student_user_trigger.sql`

## 4. Mevcut koç hesaplarını senkronize etme (FK hatası için)

`students_coach_id_fkey` hatası alıyorsanız SQL Editor'de:

`supabase/migrations/004_backfill_users_from_auth.sql` (trigger geçici kapatılır — `Students cannot self-register` hatası aldıysanız güncel dosyayı tekrar çalıştırın)

## 5. Chat storage (isteğe bağlı, dosya gönderimi için)

Yeni bir SQL sorgusu açıp çalıştırın:

`supabase/migrations/002_storage_chat.sql`

Veya Dashboard → **Storage** → **New bucket** → ad: `chat-attachments`, public: **kapalı**.

## 6. Realtime (chat için)

**Database → Publications** → `supabase_realtime` içinde `messages` tablosu listelenmeli (001 migration ekler).

Yoksa SQL Editor'da:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
```

## 7. Auth ayarı (geliştirme)

**Authentication → Providers → Email**:
- Geliştirme için e-posta onayını kapatabilirsiniz (**Confirm email** = off).
- Koç kaydı için `.env.local` içinde `SUPABASE_SERVICE_ROLE_KEY` tanımlıysa uygulama yine de Admin API ile kayıt yapar.

## 8. Uygulamayı çalıştırma

```bash
npm run dev
```

- Koç kaydı: http://localhost:3000/register  
- Giriş: http://localhost:3000/login  

## Özet

| Adım | Dosya | Zorunlu |
|------|--------|---------|
| Tablolar + RLS + trigger | `001_initial_schema.sql` | Evet |
| Öğrenci ekleme trigger fix | `003_fix_student_user_trigger.sql` | Evet (001 eski sürümse) |
| Auth → users senkron | `004_backfill_users_from_auth.sql` | Koç FK hatası varsa |
| Chat dosya bucket | `002_storage_chat.sql` | Hayır (chat dosyası için evet) |

Veritabanı olmadan kayıt/giriş `users` tablosuna yazamadığı için hata verir; önce **001** migration'ı mutlaka çalıştırın.
