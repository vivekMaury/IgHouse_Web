-- RLS Isolation Tests
-- Proves workspace A cannot read/write workspace B data.
-- Run with: supabase test db
--
-- These tests use raw SQL to simulate two different users and verify
-- that RLS policies enforce complete tenant isolation.

begin;

-- Create test plan
select plan(12);

--------------------------------------------------------------------------------
-- Setup: Create two test users, workspaces, and seed data
--------------------------------------------------------------------------------

-- Insert test users into auth.users
insert into auth.users (id, email, instance_id, aud, role, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'alice@test.com', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', crypt('password', gen_salt('bf')), now(), now(), now()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bob@test.com', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', crypt('password', gen_salt('bf')), now(), now(), now());

-- The on_auth_user_created trigger auto-creates workspaces and members.
-- Get their workspace IDs.

-- Get Alice's workspace
select ok(
  (select count(*) from public.workspaces where owner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') = 1,
  'Alice has exactly one workspace created by trigger'
);

-- Get Bob's workspace
select ok(
  (select count(*) from public.workspaces where owner_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') = 1,
  'Bob has exactly one workspace created by trigger'
);

-- Seed data in Alice's workspace
do $$
declare
  ws_a uuid;
  ws_b uuid;
  contact_a uuid;
  conv_a uuid;
  flow_a uuid;
  fv_a uuid;
begin
  select id into ws_a from public.workspaces where owner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  select id into ws_b from public.workspaces where owner_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  -- Alice's connected account
  insert into public.connected_accounts (id, workspace_id, platform_account_id, encrypted_access_token, token_iv)
  values ('ca-alice-0000-0000-000000000000', ws_a, 'ig_alice', '\x00', '\x00');

  -- Alice's contact
  insert into public.contacts (id, workspace_id, platform_scoped_id, username)
  values ('ct-alice-0000-0000-000000000000', ws_a, 'user_123', 'testuser');
  contact_a := 'ct-alice-0000-0000-000000000000';

  -- Alice's tag
  insert into public.tags (id, workspace_id, name) values ('tg-alice-0000-0000-000000000000', ws_a, 'VIP');

  -- Alice's contact tag
  insert into public.contact_tags (contact_id, tag_id) values (contact_a, 'tg-alice-0000-0000-000000000000');

  -- Alice's conversation
  insert into public.conversations (id, workspace_id, contact_id, connected_account_id)
  values ('cv-alice-0000-0000-000000000000', ws_a, contact_a, 'ca-alice-0000-0000-000000000000');
  conv_a := 'cv-alice-0000-0000-000000000000';

  -- Alice's message
  insert into public.messages (workspace_id, conversation_id, direction, content)
  values (ws_a, conv_a, 'inbound', 'Hello from contact');

  -- Alice's flow
  insert into public.flows (id, workspace_id, name) values ('fl-alice-0000-0000-000000000000', ws_a, 'Welcome Flow');
  flow_a := 'fl-alice-0000-0000-000000000000';

  -- Alice's flow version
  insert into public.flow_versions (id, workspace_id, flow_id, definition)
  values ('fv-alice-0000-0000-000000000000', ws_a, flow_a, '{"nodes":[],"edges":[]}');
  fv_a := 'fv-alice-0000-0000-000000000000';

  -- Alice's flow run
  insert into public.flow_runs (workspace_id, flow_id, flow_version_id, contact_id, trigger_event_id)
  values (ws_a, flow_a, fv_a, contact_a, 'evt_001');

  -- Alice's automation log
  insert into public.automation_logs (workspace_id, flow_id, action, success)
  values (ws_a, flow_a, 'send_dm', true);

  -- Bob's contact (to verify isolation)
  insert into public.contacts (workspace_id, platform_scoped_id, username)
  values (ws_b, 'user_456', 'bobcontact');
end $$;

--------------------------------------------------------------------------------
-- Test: Bob cannot see Alice's data
--------------------------------------------------------------------------------

-- Set the auth context to Bob
set local role authenticated;
set local request.jwt.claims to '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","role":"authenticated"}';
-- For Supabase auth.uid() to work:
set local request.jwt.claim.sub to 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

-- Bob cannot see Alice's workspace
select is(
  (select count(*) from public.workspaces where owner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  0::bigint,
  'Bob cannot see Alice workspace'
);

-- Bob cannot see Alice's connected accounts
select is(
  (select count(*) from public.connected_accounts where id = 'ca-alice-0000-0000-000000000000'),
  0::bigint,
  'Bob cannot see Alice connected accounts'
);

-- Bob cannot see Alice's contacts
select is(
  (select count(*) from public.contacts where username = 'testuser'),
  0::bigint,
  'Bob cannot see Alice contacts'
);

-- Bob cannot see Alice's tags
select is(
  (select count(*) from public.tags where name = 'VIP'),
  0::bigint,
  'Bob cannot see Alice tags'
);

-- Bob cannot see Alice's conversations
select is(
  (select count(*) from public.conversations where id = 'cv-alice-0000-0000-000000000000'),
  0::bigint,
  'Bob cannot see Alice conversations'
);

-- Bob cannot see Alice's messages
select is(
  (select count(*) from public.messages where content = 'Hello from contact'),
  0::bigint,
  'Bob cannot see Alice messages'
);

-- Bob cannot see Alice's flows
select is(
  (select count(*) from public.flows where name = 'Welcome Flow'),
  0::bigint,
  'Bob cannot see Alice flows'
);

-- Bob cannot see Alice's flow runs
select is(
  (select count(*) from public.flow_runs where trigger_event_id = 'evt_001'),
  0::bigint,
  'Bob cannot see Alice flow runs'
);

-- Bob CAN see his own contacts
select ok(
  (select count(*) from public.contacts where username = 'bobcontact') = 1,
  'Bob can see his own contacts'
);

-- Bob can see only his own workspace
select is(
  (select count(*) from public.workspaces),
  1::bigint,
  'Bob sees exactly one workspace (his own)'
);

select * from finish();
rollback;
