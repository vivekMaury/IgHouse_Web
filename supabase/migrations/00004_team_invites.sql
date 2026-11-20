-- 00004_team_invites.sql
-- Team Invites, Workspace RBAC Roles (Owner, Admin, Member, Viewer), and Invitations Schema

-- 1. Extend workspace_role enum to include 'viewer' if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type typ
    JOIN pg_enum enm ON enm.enumtypid = typ.oid
    WHERE typ.typname = 'workspace_role' AND enm.enumlabel = 'viewer'
  ) THEN
    ALTER TYPE public.workspace_role ADD VALUE 'viewer';
  END IF;
END $$;

-- 2. Create workspace_invitations table
CREATE TABLE IF NOT EXISTS public.workspace_invitations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email        text NOT NULL,
  role         public.workspace_role NOT NULL DEFAULT 'member',
  token_hash   text NOT NULL UNIQUE,
  invited_by   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  expires_at   timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_token_hash ON public.workspace_invitations(token_hash);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_workspace ON public.workspace_invitations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_lookup ON public.workspace_invitations(email, workspace_id, status);

-- 3. Security Helper Function: Get current user role in workspace
CREATE OR REPLACE FUNCTION public.get_user_workspace_role(ws_id uuid)
RETURNS public.workspace_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role
  FROM public.workspace_members
  WHERE workspace_id = ws_id AND user_id = auth.uid()
  LIMIT 1;
$$;

-- 4. Enable RLS on workspace_invitations
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Owners and Admins can view workspace invitations
CREATE POLICY "Admins and owners can view workspace invites"
  ON public.workspace_invitations FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Policy: Owners and Admins can create workspace invitations
CREATE POLICY "Admins and owners can insert workspace invites"
  ON public.workspace_invitations FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Policy: Owners and Admins can update workspace invitations (revoke / resend)
CREATE POLICY "Admins and owners can update workspace invites"
  ON public.workspace_invitations FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Policy: Owners and Admins can delete workspace invitations
CREATE POLICY "Admins and owners can delete workspace invites"
  ON public.workspace_invitations FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );
