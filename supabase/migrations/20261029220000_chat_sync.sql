-- Chat conversations + messages + indexes

create table if not exists public.chat_conversations (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Nuevo chat' check (char_length(title) between 1 and 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chat_conversations_user_updated_idx
  on public.chat_conversations (user_id, updated_at desc);

alter table public.chat_conversations enable row level security;
grant select, insert, update, delete on public.chat_conversations to authenticated;
revoke all on public.chat_conversations from anon;

drop policy if exists "chat_conversations_select_own" on public.chat_conversations;
create policy "chat_conversations_select_own"
  on public.chat_conversations for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "chat_conversations_insert_own" on public.chat_conversations;
create policy "chat_conversations_insert_own"
  on public.chat_conversations for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "chat_conversations_update_own" on public.chat_conversations;
create policy "chat_conversations_update_own"
  on public.chat_conversations for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "chat_conversations_delete_own" on public.chat_conversations;
create policy "chat_conversations_delete_own"
  on public.chat_conversations for delete to authenticated
  using ((select auth.uid()) = user_id);

create table if not exists public.chat_messages (
  id text primary key,
  conversation_id text not null references public.chat_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) <= 85000),
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_conversation_created_idx
  on public.chat_messages (conversation_id, created_at);

create index if not exists chat_messages_user_id_idx
  on public.chat_messages (user_id);

alter table public.chat_messages enable row level security;
grant select, insert, update, delete on public.chat_messages to authenticated;
revoke all on public.chat_messages from anon;

drop policy if exists "chat_messages_select_own" on public.chat_messages;
create policy "chat_messages_select_own"
  on public.chat_messages for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "chat_messages_insert_own" on public.chat_messages;
create policy "chat_messages_insert_own"
  on public.chat_messages for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "chat_messages_update_own" on public.chat_messages;
create policy "chat_messages_update_own"
  on public.chat_messages for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "chat_messages_delete_own" on public.chat_messages;
create policy "chat_messages_delete_own"
  on public.chat_messages for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Cleanup legacy artifacts if present
drop index if exists public.messages_conversation_created_idx;
drop index if exists public.messages_conversation_id_idx;
