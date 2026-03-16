drop policy if exists "Admins can view all user badges" on public.user_badges;
create policy "Admins can view all user badges" on public.user_badges
  for select using (
    exists (
      select 1
      from public.profiles admin_profile
      where admin_profile.id = auth.uid()
        and admin_profile.is_admin = true
    )
  );

drop policy if exists "Admins can view all mission attempts" on public.missao_attempts;
create policy "Admins can view all mission attempts" on public.missao_attempts
  for select using (
    exists (
      select 1
      from public.profiles admin_profile
      where admin_profile.id = auth.uid()
        and admin_profile.is_admin = true
    )
  );

drop policy if exists "Admins can view all pronunciation attempts" on public.pronunciation_attempts;
create policy "Admins can view all pronunciation attempts" on public.pronunciation_attempts
  for select using (
    exists (
      select 1
      from public.profiles admin_profile
      where admin_profile.id = auth.uid()
        and admin_profile.is_admin = true
    )
  );

drop policy if exists "Admins can view all AI sessions" on public.ai_sessions;
create policy "Admins can view all AI sessions" on public.ai_sessions
  for select using (
    exists (
      select 1
      from public.profiles admin_profile
      where admin_profile.id = auth.uid()
        and admin_profile.is_admin = true
    )
  );

drop policy if exists "Admins can view all onboarding completions" on public.onboarding_completions;
create policy "Admins can view all onboarding completions" on public.onboarding_completions
  for select using (
    exists (
      select 1
      from public.profiles admin_profile
      where admin_profile.id = auth.uid()
        and admin_profile.is_admin = true
    )
  );

drop policy if exists "Admins can view all user progress" on public.user_progress;
create policy "Admins can view all user progress" on public.user_progress
  for select using (
    exists (
      select 1
      from public.profiles admin_profile
      where admin_profile.id = auth.uid()
        and admin_profile.is_admin = true
    )
  );
