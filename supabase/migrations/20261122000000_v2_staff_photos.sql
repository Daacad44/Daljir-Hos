-- v2: staff management fields, doctor profiles and photos

-- ---------- Staff (profiles) ----------
alter table public.profiles
  add column if not exists is_active boolean not null default true,
  add column if not exists job_title text,
  add column if not exists avatar_url text;

-- A deactivated account behaves like a pending one: it sees no data.
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role <> 'pending' and is_active
  );
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and is_active
  );
$$;

-- Non-admins may edit their own name/phone/avatar but never role or active flag.
create or replace function public.my_active()
returns boolean language sql stable security definer set search_path = public as $$
  select is_active from public.profiles where id = auth.uid();
$$;
revoke execute on function public.my_active() from public, anon;
grant execute on function public.my_active() to authenticated;

alter policy "update own profile or admin" on public.profiles
  using (id = auth.uid() or public.is_admin())
  with check (
    public.is_admin()
    or (id = auth.uid() and role = public.my_role() and is_active = public.my_active())
  );

-- Last sign-in time for the staff list (admins only)
create or replace function public.staff_last_sign_in()
returns table (id uuid, last_sign_in_at timestamptz)
language sql stable security definer set search_path = public, auth as $$
  select u.id, u.last_sign_in_at from auth.users u where public.is_admin();
$$;
revoke execute on function public.staff_last_sign_in() from public, anon;
grant execute on function public.staff_last_sign_in() to authenticated;

-- ---------- Doctors ----------
alter table public.doctors
  add column if not exists photo_url text,
  add column if not exists bio text,
  add column if not exists years_experience integer check (years_experience >= 0),
  add column if not exists working_days text,
  add column if not exists working_hours text;

-- ---------- Patients ----------
alter table public.patients
  add column if not exists photo_url text;

-- ---------- Storage: photos bucket ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "staff upload photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and public.is_staff());
create policy "staff update photos" on storage.objects for update to authenticated
  using (bucket_id = 'photos' and public.is_staff());
create policy "staff delete photos" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and public.is_staff());
