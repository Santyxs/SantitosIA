-- Cover FK columns flagged by Performance Advisor (unindexed_foreign_keys)

create index if not exists chat_messages_user_id_idx
  on public.chat_messages (user_id);

create index if not exists messages_conversation_id_idx
  on public.messages (conversation_id);
