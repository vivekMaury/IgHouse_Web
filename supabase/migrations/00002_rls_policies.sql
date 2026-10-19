-- 00002_rls_policies.sql
-- Row Level Security: deny-by-default, workspace isolation on every table.

-- Enable RLS on all tables
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.connected_accounts enable row level security;
alter table public.contacts enable row level security;
alter table public.tags enable row level security;
alter table public.contact_tags enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.flows enable row level security;
alter table public.flow_versions enable row level security;
alter table public.flow_runs enable row level security;
alter table public.webhook_events enable row level security;
alter table public.automation_logs enable row level security;
alter table public.captured_leads enable row level security;

--------------------------------------------------------------------------------
-- Helper: get workspace IDs the current user is a member of
--------------------------------------------------------------------------------
create or replace function public.user_workspace_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select workspace_id
  from public.workspace_members
  where user_id = auth.uid();
$$;

--------------------------------------------------------------------------------
-- Workspaces
--------------------------------------------------------------------------------
create policy "Users can view their workspaces"
  on public.workspaces for select
  using (id in (select public.user_workspace_ids()));

create policy "Users can update their workspaces"
  on public.workspaces for update
  using (id in (select public.user_workspace_ids()));

create policy "Authenticated users can create workspaces"
  on public.workspaces for insert
  with check (auth.uid() = owner_id);

--------------------------------------------------------------------------------
-- Workspace Members
--------------------------------------------------------------------------------
create policy "Members can view their workspace members"
  on public.workspace_members for select
  using (workspace_id in (select public.user_workspace_ids()));

create policy "Owners/admins can insert members"
  on public.workspace_members for insert
  with check (
    workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );

create policy "Owners can delete members"
  on public.workspace_members for delete
  using (
    workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid() and role = 'owner'
    )
  );

--------------------------------------------------------------------------------
-- Connected Accounts
--------------------------------------------------------------------------------
create policy "Members can view connected accounts"
  on public.connected_accounts for select
  using (workspace_id in (select public.user_workspace_ids()));

create policy "Members can insert connected accounts"
  on public.connected_accounts for insert
  with check (workspace_id in (select public.user_workspace_ids()));

create policy "Members can update connected accounts"
  on public.connected_accounts for update
  using (workspace_id in (select public.user_workspace_ids()));

create policy "Members can delete connected accounts"
  on public.connected_accounts for delete
  using (workspace_id in (select public.user_workspace_ids()));

--------------------------------------------------------------------------------
-- Contacts
--------------------------------------------------------------------------------
create policy "Members can view contacts"
  on public.contacts for select
  using (workspace_id in (select public.user_workspace_ids()));

create policy "Members can insert contacts"
  on public.contacts for insert
  with check (workspace_id in (select public.user_workspace_ids()));

create policy "Members can update contacts"
  on public.contacts for update
  using (workspace_id in (select public.user_workspace_ids()));

create policy "Members can delete contacts"
  on public.contacts for delete
  using (workspace_id in (select public.user_workspace_ids()));

--------------------------------------------------------------------------------
-- Tags
--------------------------------------------------------------------------------
create policy "Members can view tags"
  on public.tags for select
  using (workspace_id in (select public.user_workspace_ids()));

create policy "Members can insert tags"
  on public.tags for insert
  with check (workspace_id in (select public.user_workspace_ids()));

create policy "Members can update tags"
  on public.tags for update
  using (workspace_id in (select public.user_workspace_ids()));

create policy "Members can delete tags"
  on public.tags for delete
  using (workspace_id in (select public.user_workspace_ids()));

--------------------------------------------------------------------------------
-- Contact Tags
--------------------------------------------------------------------------------
create policy "Members can view contact tags"
  on public.contact_tags for select
  using (
    contact_id in (
      select id from public.contacts
      where workspace_id in (select public.user_workspace_ids())
    )
  );

create policy "Members can insert contact tags"
  on public.contact_tags for insert
  with check (
    contact_id in (
      select id from public.contacts
      where workspace_id in (select public.user_workspace_ids())
    )
  );

create policy "Members can delete contact tags"
  on public.contact_tags for delete
  using (
    contact_id in (
      select id from public.contacts
      where workspace_id in (select public.user_workspace_ids())
    )
  );

--------------------------------------------------------------------------------
-- Conversations
--------------------------------------------------------------------------------
create policy "Members can view conversations"
  on public.conversations for select
  using (workspace_id in (select public.user_workspace_ids()));

create policy "Members can insert conversations"
  on public.conversations for insert
  with check (workspace_id in (select public.user_workspace_ids()));

create policy "Members can update conversations"
  on public.conversations for update
  using (workspace_id in (select public.user_workspace_ids()));

--------------------------------------------------------------------------------
-- Messages
--------------------------------------------------------------------------------
create policy "Members can view messages"
  on public.messages for select
  using (workspace_id in (select public.user_workspace_ids()));

create policy "Members can insert messages"
  on public.messages for insert
  with check (workspace_id in (select public.user_workspace_ids()));

--------------------------------------------------------------------------------
-- Flows
--------------------------------------------------------------------------------
create policy "Members can view flows"
  on public.flows for select
  using (workspace_id in (select public.user_workspace_ids()));

create policy "Members can insert flows"
  on public.flows for insert
  with check (workspace_id in (select public.user_workspace_ids()));

create policy "Members can update flows"
  on public.flows for update
  using (workspace_id in (select public.user_workspace_ids()));

create policy "Members can delete flows"
  on public.flows for delete
  using (workspace_id in (select public.user_workspace_ids()));

--------------------------------------------------------------------------------
-- Flow Versions
--------------------------------------------------------------------------------
create policy "Members can view flow versions"
  on public.flow_versions for select
  using (workspace_id in (select public.user_workspace_ids()));

create policy "Members can insert flow versions"
  on public.flow_versions for insert
  with check (workspace_id in (select public.user_workspace_ids()));

--------------------------------------------------------------------------------
-- Flow Runs
--------------------------------------------------------------------------------
create policy "Members can view flow runs"
  on public.flow_runs for select
  using (workspace_id in (select public.user_workspace_ids()));

create policy "Members can insert flow runs"
  on public.flow_runs for insert
  with check (workspace_id in (select public.user_workspace_ids()));

create policy "Members can update flow runs"
  on public.flow_runs for update
  using (workspace_id in (select public.user_workspace_ids()));

--------------------------------------------------------------------------------
-- Webhook Events (service-role only for writes, members can read their workspace's)
--------------------------------------------------------------------------------
create policy "Members can view their webhook events"
  on public.webhook_events for select
  using (workspace_id in (select public.user_workspace_ids()));

--------------------------------------------------------------------------------
-- Automation Logs
--------------------------------------------------------------------------------
create policy "Members can view automation logs"
  on public.automation_logs for select
  using (workspace_id in (select public.user_workspace_ids()));

--------------------------------------------------------------------------------
-- Captured Leads
--------------------------------------------------------------------------------
create policy "Members can view captured leads"
  on public.captured_leads for select
  using (workspace_id in (select public.user_workspace_ids()));

create policy "Members can insert captured leads"
  on public.captured_leads for insert
  with check (workspace_id in (select public.user_workspace_ids()));
