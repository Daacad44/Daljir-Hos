-- Hospital Management System: initial schema
-- Tables: profiles, departments, doctors, patients, appointments, medicines, invoices

create extension if not exists "pgcrypto";

-- ---------- Enums ----------
create type public.staff_role as enum ('pending', 'admin', 'doctor', 'receptionist', 'pharmacist', 'accountant');
create type public.gender as enum ('male', 'female');
create type public.appointment_status as enum ('scheduled', 'completed', 'cancelled', 'no_show');
create type public.invoice_status as enum ('unpaid', 'partial', 'paid', 'cancelled');

-- ---------- Helpers ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- Profiles (staff accounts) ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text,
  role public.staff_role not null default 'pending',
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- New auth user -> profile row. The first user becomes admin; everyone after
-- that starts as 'pending' and sees no data until an admin approves them.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case when exists (select 1 from public.profiles) then 'pending'::public.staff_role
         else 'admin'::public.staff_role end
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role <> 'pending');
$$;

create or replace function public.my_role()
returns public.staff_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------- Departments ----------
create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Doctors ----------
create table public.doctors (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  specialization text not null,
  department_id uuid references public.departments(id) on delete set null,
  phone text,
  email text,
  consultation_fee numeric(10,2) not null default 0 check (consultation_fee >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Patients ----------
create sequence public.patient_no_seq start 1001;
create table public.patients (
  id uuid primary key default gen_random_uuid(),
  patient_no text not null unique default ('P-' || nextval('public.patient_no_seq')),
  full_name text not null,
  gender public.gender not null,
  date_of_birth date,
  phone text,
  address text,
  blood_group text check (blood_group in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  emergency_contact text,
  medical_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Appointments ----------
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id) on delete restrict,
  scheduled_at timestamptz not null,
  reason text,
  status public.appointment_status not null default 'scheduled',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index appointments_scheduled_at_idx on public.appointments (scheduled_at);
create index appointments_patient_idx on public.appointments (patient_id);
create index appointments_doctor_idx on public.appointments (doctor_id);

-- ---------- Medicines (pharmacy stock) ----------
create table public.medicines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  unit text not null default 'tablet',
  unit_price numeric(10,2) not null default 0 check (unit_price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  reorder_level integer not null default 10 check (reorder_level >= 0),
  expiry_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Invoices ----------
create sequence public.invoice_no_seq start 1001;
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_no text not null unique default ('INV-' || nextval('public.invoice_no_seq')),
  patient_id uuid not null references public.patients(id) on delete restrict,
  appointment_id uuid references public.appointments(id) on delete set null,
  description text,
  amount numeric(10,2) not null check (amount >= 0),
  amount_paid numeric(10,2) not null default 0 check (amount_paid >= 0),
  status public.invoice_status not null default 'unpaid',
  payment_method text check (payment_method in ('cash','evc_plus','zaad','sahal','edahab','bank','card','insurance')),
  issued_on date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index invoices_patient_idx on public.invoices (patient_id);

-- updated_at triggers
do $$
declare t text;
begin
  foreach t in array array['profiles','departments','doctors','patients','appointments','medicines','invoices'] loop
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- ---------- Row Level Security ----------
-- Approved staff (role other than 'pending') can read and write records.
-- Only admins can delete records or change staff roles.
-- Everyone can read their own profile; staff can read all profiles.
alter table public.profiles enable row level security;
create policy "read profiles" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_staff());
create policy "update own profile or admin" on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (public.is_admin() or (id = auth.uid() and role = public.my_role()));
create policy "admin delete profiles" on public.profiles for delete to authenticated using (public.is_admin());

do $$
declare t text;
begin
  foreach t in array array['departments','doctors','patients','appointments','medicines','invoices'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "staff select" on public.%I for select to authenticated using (public.is_staff())', t);
    execute format('create policy "staff insert" on public.%I for insert to authenticated with check (public.is_staff())', t);
    execute format('create policy "staff update" on public.%I for update to authenticated using (public.is_staff()) with check (public.is_staff())', t);
    execute format('create policy "admin delete" on public.%I for delete to authenticated using (public.is_admin())', t);
  end loop;
end $$;
