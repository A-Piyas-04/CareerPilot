-- Phase 2.1: grant API roles access to assistant conversation infrastructure.

grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on public.assistant_conversations to authenticated, service_role;
grant select, insert, delete on public.assistant_messages to authenticated, service_role;
