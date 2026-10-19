-- 00001_foundation.sql
-- P0 Step 2: Core tables for IgHouse multi-tenant schema
-- All tables include workspace_id with RLS enforcing tenant isolation.

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

--------------------------------------------------------------------------------
-- 1. Workspaces
--------------------------------------------------------------------------------
create table public.workspaces (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  owner_id   uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_workspaces_owner on public.workspaces(owner_id);

--------------------------------------------------------------------------------
-- 2. Workspace Members
--------------------------------------------------------------------------------
create type public.workspace_role as enum ('owner', 'admin', 'member');

create table public.workspace_members (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         public.workspace_role not null default 'member',
  created_at   timestamptz not null default now(),
  unique(workspace_id, user_id)
);

create index idx_workspace_members_workspace on public.workspace_members(workspace_id);
create index idx_workspace_members_user on public.workspace_members(user_id);

--------------------------------------------------------------------------------
-- 3. Connected Accounts (Instagram)
--------------------------------------------------------------------------------
create table public.connected_accounts (
  id                    uuid primary key default gen_random_uuid(),
  workspace_id          uuid not null references public.workspaces(id) on delete cascade,
  platform              text not null default 'instagram',
  platform_account_id   text not null,
  username              text,
  avatar_url            text,
  encrypted_access_token bytea not null,
  token_iv              bytea not null,
  key_version           int not null default 1,
  token_expires_at      timestamptz,
  scopes                text[] not null default '{}',
  is_active             boolean not null default true,
  last_webhook_at       timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique(workspace_id, platform, platform_account_id)
);

create index idx_connected_accounts_workspace on public.connected_accounts(workspace_id);

--------------------------------------------------------------------------------
-- 4. Contacts
--------------------------------------------------------------------------------
create table public.contacts (
  id                    uuid primary key default gen_random_uuid(),
  workspace_id          uuid not null references public.workspaces(id) on delete cascade,
  platform_scoped_id    text not null,
  username              text,
  full_name             text,
  avatar_url            text,
  email                 text,
  phone                 text,
  custom_fields         jsonb not null default '{}',
  source_flow_id        uuid,
  opted_out             boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique(workspace_id, platform_scoped_id)
);

create index idx_contacts_workspace on public.contacts(workspace_id);
create index idx_contacts_workspace_scoped on public.contacts(workspace_id, platform_scoped_id);

--------------------------------------------------------------------------------
-- 5. Tags
--------------------------------------------------------------------------------
create table public.tags (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name         text not null,
  color        text not null default '#6B7280',
  created_at   timestamptz not null default now(),
  unique(workspace_id, name)
);

create index idx_tags_workspace on public.tags(workspace_id);

--------------------------------------------------------------------------------
-- 6. Contact Tags (junction)
--------------------------------------------------------------------------------
create table public.contact_tags (
  contact_id uuid not null references public.contacts(id) on delete cascade,
  tag_id     uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (contact_id, tag_id)
);

create index idx_contact_tags_tag on public.contact_tags(tag_id);

--------------------------------------------------------------------------------
-- 7. Conversations
--------------------------------------------------------------------------------
create table public.conversations (
  id                    uuid primary key default gen_random_uuid(),
  workspace_id          uuid not null references public.workspaces(id) on delete cascade,
  contact_id            uuid not null references public.contacts(id) on delete cascade,
  connected_account_id  uuid not null references public.connected_accounts(id) on delete cascade,
  status                text not null default 'open' check (status in ('open', 'closed', 'archived')),
  bot_paused            boolean not null default false,
  bot_paused_until      timestamptz,
  assigned_to           uuid references auth.users(id) on delete set null,
  last_message_at       timestamptz,
  unread_count          int not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique(workspace_id, contact_id, connected_account_id)
);

create index idx_conversations_workspace on public.conversations(workspace_id);
create index idx_conversations_workspace_last on public.conversations(workspace_id, last_message_at desc);

--------------------------------------------------------------------------------
-- 8. Messages
--------------------------------------------------------------------------------
create type public.message_direction as enum ('inbound', 'outbound');
create type public.message_source as enum ('automation', 'human', 'system');

create table public.messages (
  id                    uuid primary key default gen_random_uuid(),
  workspace_id          uuid not null references public.workspaces(id) on delete cascade,
  conversation_id       uuid not null references public.conversations(id) on delete cascade,
  direction             public.message_direction not null,
  source                public.message_source not null default 'automation',
  content               text,
  media_url             text,
  media_type            text,
  platform_message_id   text,
  metadata              jsonb not null default '{}',
  sent_at               timestamptz,
  delivered_at          timestamptz,
  read_at               timestamptz,
  created_at            timestamptz not null default now()
);

create index idx_messages_conversation on public.messages(conversation_id, created_at);
create index idx_messages_workspace on public.messages(workspace_id);

--------------------------------------------------------------------------------
-- 9. Flows
--------------------------------------------------------------------------------
create type public.flow_status as enum ('draft', 'published', 'paused', 'archived');

create table public.flows (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name         text not null,
  description  text,
  status       public.flow_status not null default 'draft',
  trigger_type text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index idx_flows_workspace on public.flows(workspace_id);
create index idx_flows_workspace_status on public.flows(workspace_id, status);

--------------------------------------------------------------------------------
-- 10. Flow Versions
--------------------------------------------------------------------------------
create table public.flow_versions (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  flow_id      uuid not null references public.flows(id) on delete cascade,
  version      int not null default 1,
  definition   jsonb not null,
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  unique(flow_id, version)
);

create index idx_flow_versions_flow on public.flow_versions(flow_id);

--------------------------------------------------------------------------------
-- 11. Flow Runs
--------------------------------------------------------------------------------
create type public.flow_run_status as enum ('running', 'waiting', 'completed', 'failed', 'cancelled');

create table public.flow_runs (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid not null references public.workspaces(id) on delete cascade,
  flow_id           uuid not null references public.flows(id) on delete cascade,
  flow_version_id   uuid not null references public.flow_versions(id),
  contact_id        uuid not null references public.contacts(id) on delete cascade,
  current_node_id   text,
  status            public.flow_run_status not null default 'running',
  context           jsonb not null default '{}',
  trigger_event_id  text,
  started_at        timestamptz not null default now(),
  completed_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_flow_runs_workspace on public.flow_runs(workspace_id);
create index idx_flow_runs_contact_active on public.flow_runs(workspace_id, contact_id) where status in ('running', 'waiting');
create index idx_flow_runs_dedupe on public.flow_runs(flow_id, contact_id, trigger_event_id);

--------------------------------------------------------------------------------
-- 12. Webhook Events
--------------------------------------------------------------------------------
create table public.webhook_events (
  id                  uuid primary key default gen_random_uuid(),
  workspace_id        uuid references public.workspaces(id) on delete cascade,
  platform_event_id   text not null unique,
  event_type          text not null,
  payload             jsonb not null,
  status              text not null default 'received' check (status in ('received', 'processing', 'processed', 'failed', 'dead')),
  attempts            int not null default 0,
  last_error          text,
  created_at          timestamptz not null default now(),
  processed_at        timestamptz
);

create index idx_webhook_events_status on public.webhook_events(status) where status in ('received', 'processing');

--------------------------------------------------------------------------------
-- 13. Automation Logs
--------------------------------------------------------------------------------
create table public.automation_logs (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.workspaces(id) on delete cascade,
  flow_run_id     uuid references public.flow_runs(id) on delete set null,
  flow_id         uuid references public.flows(id) on delete set null,
  node_id         text,
  action          text not null,
  success         boolean not null,
  error_message   text,
  meta_response   jsonb,
  created_at      timestamptz not null default now()
);

create index idx_automation_logs_workspace on public.automation_logs(workspace_id, created_at desc);
create index idx_automation_logs_flow_run on public.automation_logs(flow_run_id);

--------------------------------------------------------------------------------
-- 14. Captured Leads
--------------------------------------------------------------------------------
create table public.captured_leads (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  contact_id   uuid not null references public.contacts(id) on delete cascade,
  flow_id      uuid references public.flows(id) on delete set null,
  field_name   text not null,
  field_value  text not null,
  created_at   timestamptz not null default now()
);

create index idx_captured_leads_workspace on public.captured_leads(workspace_id);
create index idx_captured_leads_contact on public.captured_leads(contact_id);

--------------------------------------------------------------------------------
-- Helper: auto-update updated_at
--------------------------------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at triggers
create trigger set_updated_at before update on public.workspaces for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.workspace_members for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.connected_accounts for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.contacts for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.conversations for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.flows for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.flow_runs for each row execute function public.handle_updated_at();

--------------------------------------------------------------------------------
-- Auto-create workspace + member on user signup
--------------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
declare
  ws_id uuid;
begin
  insert into public.workspaces (name, slug, owner_id)
  values (
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    replace(gen_random_uuid()::text, '-', ''),
    new.id
  )
  returning id into ws_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (ws_id, new.id, 'owner');

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
