-- Raise daily AI message limit to 50
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
  v_limit integer := 50;
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
