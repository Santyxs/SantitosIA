-- Fix Performance Advisor: auth_rls_initplan + multiple_permissive_policies
-- Wrap auth.uid() in (select auth.uid()) so it is evaluated once per query.
-- Collapse duplicate permissive SELECT policies on public.profiles.

-- journal_entries
drop policy if exists "Users can read their own journal entries" on public.journal_entries;
create policy "Users can read their own journal entries"
  on public.journal_entries
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own journal entries" on public.journal_entries;
create policy "Users can create their own journal entries"
  on public.journal_entries
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own journal entries" on public.journal_entries;
create policy "Users can update their own journal entries"
  on public.journal_entries
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own journal entries" on public.journal_entries;
create policy "Users can delete their own journal entries"
  on public.journal_entries
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- profiles: remove duplicates then recreate a single optimized policy per action
drop policy if exists "Read own profile" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists profiles_select_own on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists "Update own profile" on public.profiles;
drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
