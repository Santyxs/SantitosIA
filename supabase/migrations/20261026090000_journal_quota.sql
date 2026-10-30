-- Journal entries + daily AI quota (final correct definitions)
-- Idempotent: safe to re-run on existing projects.

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  content text not null check (char_length(content) <= 20000),
  category text not null default 'Personal' check (char_length(category) <= 60),
  visibility text not null default 'private' check (visibility in ('private', 'companion')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists journal_entries_user_updated_idx
  on public.journal_entries (user_id, updated_at desc);

alter table public.journal_entries enable row level security;
grant select, insert, update, delete on public.journal_entries to authenticated;
revoke all on public.journal_entries from anon;

drop policy if exists "Users can read their own journal entries" on public.journal_entries;
create policy "Users can read their own journal entries"
  on public.journal_entries for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own journal entries" on public.journal_entries;
create policy "Users can create their own journal entries"
  on public.journal_entries for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own journal entries" on public.journal_entries;
create policy "Users can update their own journal entries"
  on public.journal_entries for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own journal entries" on public.journal_entries;
create policy "Users can delete their own journal entries"
  on public.journal_entries for delete to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.set_journal_entry_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists journal_entries_set_updated_at on public.journal_entries;
create trigger journal_entries_set_updated_at
  before update on public.journal_entries
  for each row execute function public.set_journal_entry_updated_at();

-- Daily AI usage / quota
create table if not exists public.daily_ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default (timezone('utc', now()))::date,
  request_count integer not null default 0 check (request_count >= 0),
  primary key (user_id, usage_date)
);

alter table public.daily_ai_usage enable row level security;
revoke all on public.daily_ai_usage from anon, authenticated;

drop function if exists public.consume_ai_daily_limit(integer);
drop function if exists public.consume_ai_daily_limit();
drop function if exists public.consume_ai_daily_limit(uuid);

create or replace function public.consume_ai_daily_limit(p_user_id uuid)
returns table (allowed boolean, used integer, daily_limit integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := p_user_id;
  v_count integer;
  v_today date := (timezone('utc', now()))::date;
  v_limit integer := 5;
begin
  if v_user_id is null then
    raise exception 'User id required';
  end if;
  insert into public.daily_ai_usage (user_id, usage_date, request_count)
  values (v_user_id, v_today, 1)
  on conflict (user_id, usage_date)
  do update set request_count = public.daily_ai_usage.request_count + 1
    where public.daily_ai_usage.request_count < v_limit
  returning request_count into v_count;
  if v_count is null then
    select d.request_count into v_count
      from public.daily_ai_usage d
      where d.user_id = v_user_id and d.usage_date = v_today;
    return query select false, coalesce(v_count, 0), v_limit;
  else
    return query select true, v_count, v_limit;
  end if;
end;
$$;

create or replace function public.refund_ai_daily_limit(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (timezone('utc', now()))::date;
begin
  if p_user_id is null then
    return;
  end if;
  update public.daily_ai_usage
    set request_count = greatest(0, request_count - 1)
    where user_id = p_user_id and usage_date = v_today;
end;
$$;

revoke all on function public.consume_ai_daily_limit(uuid) from public, anon, authenticated;
grant execute on function public.consume_ai_daily_limit(uuid) to service_role;
comment on function public.consume_ai_daily_limit(uuid) is
  'Consume 1 unidad de cuota diaria de IA. Solo service_role (edge functions); no exponer a authenticated.';

revoke all on function public.refund_ai_daily_limit(uuid) from public, anon, authenticated;
grant execute on function public.refund_ai_daily_limit(uuid) to service_role;
comment on function public.refund_ai_daily_limit(uuid) is
  'Devuelve 1 unidad de cuota diaria de IA. Solo service_role (edge functions).';

-- Prevent clients from elevating their own plan
create or replace function public.prevent_client_plan_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.role() in ('anon', 'authenticated') then
    if tg_op = 'INSERT' and lower(coalesce(new.plan, 'free')) not in ('free', 'jr') then
      raise exception 'El plan solo puede activarse mediante una verificación segura en el servidor';
    elsif tg_op = 'UPDATE'
      and new.plan is distinct from old.plan
      and lower(coalesce(new.plan, 'free')) not in ('free', 'jr') then
      raise exception 'El plan solo puede activarse mediante una verificación segura en el servidor';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_client_plan_change on public.profiles;
create trigger profiles_prevent_client_plan_change
  before insert or update on public.profiles
  for each row execute function public.prevent_client_plan_change();


-- Profiles RLS (optimized, single policy per action)
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
