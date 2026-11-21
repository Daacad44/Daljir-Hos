# Daljir Hospital Management System

A CRUD hospital management system built with **Next.js 16**, **Supabase** (Postgres, Auth, Row Level Security) and **Tailwind CSS**, ready to deploy on **Vercel**.

## Modules

| Module | What it does |
| --- | --- |
| Dashboard | Patients, active doctors, today's appointments, outstanding bills, upcoming visits, low-stock medicines |
| Patients | Patient register with auto patient number (P-1001…), blood group, notes |
| Doctors | Doctors, specialization, department, consultation fee, active flag |
| Departments | Hospital units |
| Appointments | Book visits (patient + doctor + time), status tracking |
| Pharmacy | Medicine stock, price, reorder level, expiry |
| Billing | Invoices (INV-1001…), amount paid, status, EVC Plus / Zaad / Sahal / eDahab / cash… |
| Staff (admin) | Approve new accounts and assign roles |

Every module has list (search + pagination), create, edit and delete. Modules are defined in one file, `src/lib/resources.ts`; adding a field there adds it to the form and list.

## Security

- Sign-in with Supabase Auth (email + password).
- **The first account becomes admin.** Every later sign-up is `pending` and sees no data until an admin assigns a role on the Staff page.
- RLS: approved staff can read, create and edit; only admins can delete records or change roles.

## Setup

1. Create a Supabase project.
2. In Supabase, open **SQL Editor** and run `supabase/migrations/20261121000000_init_hospital.sql`, then (optional) `supabase/seed.sql`.
   Or with the CLI: `supabase link` then `supabase db push`.
3. Copy `.env.example` to `.env.local` and fill in the values from **Project Settings → API**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...   # or the anon key
   ```
4. `npm install` then `npm run dev`, open http://localhost:3000 and create the first (admin) account.

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. In Vercel, **Add New → Project**, import the repository.
3. Add the two environment variables above, then **Deploy**.
4. In Supabase **Authentication → URL Configuration**, set the Site URL to your Vercel domain.

## Notes

- Times are shown in East Africa Time (`Africa/Mogadishu`); change `src/lib/format.ts` if needed.
- Money is shown in USD.
