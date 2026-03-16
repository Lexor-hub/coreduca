create or replace function public.resolve_profile_display_name(user_email text, user_meta jsonb)
returns text
language sql
immutable
as $$
  select coalesce(
    nullif(btrim(user_meta ->> 'display_name'), ''),
    nullif(btrim(user_meta ->> 'full_name'), ''),
    nullif(btrim(user_meta ->> 'name'), ''),
    nullif(btrim(user_meta ->> 'user_name'), ''),
    nullif(btrim(user_meta ->> 'preferred_username'), ''),
    nullif(
      btrim(
        concat_ws(
          ' ',
          nullif(btrim(coalesce(user_meta ->> 'given_name', user_meta ->> 'first_name')), ''),
          nullif(btrim(coalesce(user_meta ->> 'family_name', user_meta ->> 'last_name')), '')
        )
      ),
      ''
    ),
    split_part(user_email, '@', 1)
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display_value text;
begin
  display_value := public.resolve_profile_display_name(new.email, new.raw_user_meta_data);

  insert into public.profiles (id, display_name, username)
  values (
    new.id,
    display_value,
    lower(regexp_replace(coalesce(display_value, 'user_' || substr(new.id::text, 1, 8)), '[^a-zA-Z0-9_]+', '_', 'g'))
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

with auth_profiles as (
  select
    users.id,
    public.resolve_profile_display_name(users.email, users.raw_user_meta_data) as resolved_name,
    split_part(users.email, '@', 1) as email_prefix
  from auth.users as users
)
update public.profiles as profiles
set
  display_name = auth_profiles.resolved_name,
  updated_at = now()
from auth_profiles
where profiles.id = auth_profiles.id
  and auth_profiles.resolved_name is not null
  and (
    profiles.display_name is null
    or btrim(profiles.display_name) = ''
    or lower(profiles.display_name) = lower(auth_profiles.email_prefix)
  );
