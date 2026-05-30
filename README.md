# KinoCoach

YKS koçluk SaaS — OOP Clean Architecture ile Next.js + Supabase.

## Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS v4
- Supabase (Auth, DB, Realtime, Storage)

## Architecture

```
src/
  domain/          # Entities, value objects, domain services
  application/     # Use cases, ports, DTOs
  infrastructure/  # Supabase repositories, auth, DI
  presentation/    # React UI (no business logic)
  app/             # Routes & server actions
```

## Setup

1. Copy `.env.local.example` to `.env.local` and fill Supabase keys.
2. **Create database tables** in Supabase SQL Editor — step-by-step (Turkish): [`supabase/KURULUM.md`](supabase/KURULUM.md)
   - Run `supabase/migrations/001_initial_schema.sql` (required)
   - Run `supabase/migrations/002_storage_chat.sql` (optional, for chat file uploads)
3. Install and run:

```bash
npm install
npm run dev
```

## Auth rules

- Only coaches can register at `/register`
- Coaches add students via Admin API (temporary password shown once)
- Middleware enforces `/coach/*` and `/student/*` role routes

## Reference UI

`Kino Saas/` folder contains the original Claude design prototype (read-only reference).
