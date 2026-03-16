create table if not exists public.beta_invites (
  email text primary key,
  active boolean not null default true,
  default_plan text not null default 'free' check (default_plan in ('free', 'premium_mensal', 'premium_anual')),
  invited_by uuid references public.profiles(id) on delete set null,
  note text,
  created_at timestamptz not null default now(),
  activated_at timestamptz
);

alter table public.profiles
  add column if not exists beta_access boolean not null default false,
  add column if not exists premium_granted_at timestamptz,
  add column if not exists premium_expires_at timestamptz,
  add column if not exists premium_granted_by uuid references public.profiles(id) on delete set null,
  add column if not exists billing_source text not null default 'none';

alter table public.profiles drop constraint if exists profiles_billing_source_check;
alter table public.profiles add constraint profiles_billing_source_check
  check (billing_source in ('none', 'manual'));

create table if not exists public.admin_audit_log (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid not null references public.profiles(id) on delete cascade,
  target_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.beta_invites enable row level security;
alter table public.admin_audit_log enable row level security;

revoke all on public.beta_invites from anon, authenticated;
revoke all on public.admin_audit_log from anon, authenticated;

grant select on public.beta_invites to authenticated;
grant select on public.admin_audit_log to authenticated;

drop policy if exists "Admins can manage beta invites" on public.beta_invites;
create policy "Admins can manage beta invites" on public.beta_invites
  for all using (
    exists (
      select 1
      from public.profiles admin_profile
      where admin_profile.id = auth.uid()
        and admin_profile.is_admin = true
    )
  )
  with check (
    exists (
      select 1
      from public.profiles admin_profile
      where admin_profile.id = auth.uid()
        and admin_profile.is_admin = true
    )
  );

drop policy if exists "Admins can view audit log" on public.admin_audit_log;
create policy "Admins can view audit log" on public.admin_audit_log
  for select using (
    exists (
      select 1
      from public.profiles admin_profile
      where admin_profile.id = auth.uid()
        and admin_profile.is_admin = true
    )
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display_value text;
  invite_record public.beta_invites%rowtype;
  normalized_email text;
begin
  normalized_email := lower(coalesce(new.email, ''));
  display_value := public.resolve_profile_display_name(new.email, new.raw_user_meta_data);

  select *
    into invite_record
  from public.beta_invites
  where email = normalized_email
    and active = true;

  insert into public.profiles (
    id,
    display_name,
    username,
    plano,
    beta_access,
    billing_source
  )
  values (
    new.id,
    display_value,
    lower(regexp_replace(coalesce(display_value, 'user_' || substr(new.id::text, 1, 8)), '[^a-zA-Z0-9_]+', '_', 'g')),
    case when invite_record.email is not null then invite_record.default_plan else 'free' end,
    invite_record.email is not null,
    case when invite_record.email is not null and invite_record.default_plan <> 'free' then 'manual' else 'none' end
  )
  on conflict (id) do nothing;

  if invite_record.email is not null then
    update public.beta_invites
    set activated_at = coalesce(activated_at, now())
    where email = normalized_email;
  end if;

  return new;
end;
$$;

update public.profiles
set beta_access = true
where is_admin = true;

update public.profiles
set
  billing_source = 'manual',
  premium_granted_at = coalesce(premium_granted_at, created_at)
where plano in ('premium_mensal', 'premium_anual');
