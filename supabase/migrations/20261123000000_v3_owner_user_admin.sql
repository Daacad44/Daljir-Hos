-- v3: hospital owner (super admin) and admin user management from the app

alter table public.profiles add column if not exists is_owner boolean not null default false;

-- The first admin account becomes the owner.
update public.profiles set is_owner = true
where id = (select id from public.profiles where role = 'admin' order by created_at limit 1)
  and not exists (select 1 from public.profiles where is_owner);

-- The owner always stays an active admin, and nobody can grant or remove ownership via the API.
create or replace function public.protect_owner()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.is_owner is distinct from old.is_owner and current_user in ('authenticated', 'anon') then
    raise exception 'Ownership cannot be changed from the app';
  end if;
  if old.is_owner and (new.role <> 'admin' or not new.is_active) then
    raise exception 'The owner account must stay an active admin';
  end if;
  return new;
end $$;

create trigger protect_owner before update on public.profiles
  for each row execute function public.protect_owner();

-- ---------- Admin: create a staff account ----------
create or replace function public.admin_create_user(
  p_email text,
  p_password text,
  p_full_name text,
  p_role public.staff_role,
  p_phone text default null,
  p_job_title text default null
) returns uuid
language plpgsql security definer set search_path = public, auth, extensions as $$
declare
  v_id uuid := gen_random_uuid();
  v_email text := lower(trim(p_email));
begin
  if not public.is_admin() then
    raise exception 'Only admins can create staff accounts';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Enter a valid email address';
  end if;
  if length(coalesce(p_password, '')) < 8 then
    raise exception 'Password must be at least 8 characters';
  end if;
  if exists (select 1 from auth.users where lower(email) = v_email) then
    raise exception 'An account with this email already exists';
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new
  ) values (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
    crypt(p_password, gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', p_full_name),
    now(), now(), '', '', '', ''
  );

  insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (v_id::text, v_id, jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true),
          'email', null, now(), now());

  -- handle_new_user() created the profile as 'pending'; set the chosen role and details.
  update public.profiles
     set role = p_role, full_name = coalesce(nullif(trim(p_full_name), ''), full_name),
         phone = nullif(trim(p_phone), ''), job_title = nullif(trim(p_job_title), ''), is_active = true
   where id = v_id;

  return v_id;
end $$;

-- ---------- Admin: set a new password for a staff account ----------
create or replace function public.admin_set_password(p_user_id uuid, p_password text)
returns void language plpgsql security definer set search_path = public, auth, extensions as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can reset passwords';
  end if;
  if length(coalesce(p_password, '')) < 8 then
    raise exception 'Password must be at least 8 characters';
  end if;
  if exists (select 1 from public.profiles where id = p_user_id and is_owner) and p_user_id <> auth.uid() then
    raise exception 'Only the owner can change the owner''s password';
  end if;
  update auth.users set encrypted_password = crypt(p_password, gen_salt('bf')), updated_at = now()
   where id = p_user_id;
  if not found then
    raise exception 'Account not found';
  end if;
end $$;

-- ---------- Admin: archive a staff account ----------
-- Hospitals keep staff history, so "remove" blocks the login and hides the
-- account instead of erasing it.
alter table public.profiles add column if not exists archived_at timestamptz;

create or replace function public.admin_archive_user(p_user_id uuid)
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can remove staff accounts';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'You cannot remove your own account';
  end if;
  if exists (select 1 from public.profiles where id = p_user_id and is_owner) then
    raise exception 'The owner account cannot be removed';
  end if;
  update auth.users set banned_until = 'infinity', updated_at = now() where id = p_user_id;
  if not found then
    raise exception 'Account not found';
  end if;
  update public.profiles set is_active = false, archived_at = now() where id = p_user_id;
end $$;

revoke execute on function public.admin_create_user(text, text, text, public.staff_role, text, text) from public, anon;
revoke execute on function public.admin_set_password(uuid, text) from public, anon;
revoke execute on function public.admin_archive_user(uuid) from public, anon;
revoke execute on function public.protect_owner() from public, anon, authenticated;
grant execute on function public.admin_create_user(text, text, text, public.staff_role, text, text) to authenticated;
grant execute on function public.admin_set_password(uuid, text) to authenticated;
grant execute on function public.admin_archive_user(uuid) to authenticated;
