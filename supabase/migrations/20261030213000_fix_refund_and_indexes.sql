-- Fix broken refund_ai_daily_limit (missing dollar-quoting in previous migration)
-- and clean up invalid index on non-existent public.messages table.

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

revoke all on function public.refund_ai_daily_limit(uuid) from public, anon, authenticated;
grant execute on function public.refund_ai_daily_limit(uuid) to service_role;

comment on function public.refund_ai_daily_limit(uuid) is
  'Devuelve 1 unidad de cuota diaria de IA. Solo service_role (edge functions).';

-- Drop invalid index that targeted the old/non-existent messages table
drop index if exists public.messages_conversation_id_idx;

-- Ensure FK index on chat_messages.user_id exists (from previous migration)
create index if not exists chat_messages_user_id_idx
  on public.chat_messages (user_id);
