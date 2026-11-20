import { createHash, randomBytes } from "node:crypto";

export type WorkspaceRole = "owner" | "admin" | "member" | "viewer";

export type WorkspacePermission =
  | "manage_workspace_settings"
  | "delete_workspace"
  | "transfer_ownership"
  | "manage_members"
  | "connect_instagram"
  | "manage_flows"
  | "view_flows"
  | "send_messages"
  | "read_inbox"
  | "manage_contacts"
  | "read_contacts"
  | "read_logs";

const ROLE_PERMISSIONS: Record<WorkspaceRole, Set<WorkspacePermission>> = {
  owner: new Set([
    "manage_workspace_settings",
    "delete_workspace",
    "transfer_ownership",
    "manage_members",
    "connect_instagram",
    "manage_flows",
    "view_flows",
    "send_messages",
    "read_inbox",
    "manage_contacts",
    "read_contacts",
    "read_logs",
  ]),
  admin: new Set([
    "manage_members",
    "connect_instagram",
    "manage_flows",
    "view_flows",
    "send_messages",
    "read_inbox",
    "manage_contacts",
    "read_contacts",
    "read_logs",
  ]),
  member: new Set([
    "manage_flows",
    "view_flows",
    "send_messages",
    "read_inbox",
    "manage_contacts",
    "read_contacts",
    "read_logs",
  ]),
  viewer: new Set([
    "view_flows",
    "read_inbox",
    "read_contacts",
    "read_logs",
  ]),
};

export function hasPermission(
  role: WorkspaceRole | null | undefined,
  permission: WorkspacePermission,
): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role];
  return permissions ? permissions.has(permission) : false;
}

export function canManageRole(
  actorRole: WorkspaceRole,
  targetRole: WorkspaceRole,
): boolean {
  if (actorRole === "owner") {
    return true;
  }
  if (actorRole === "admin") {
    // Admins cannot alter an owner or promote anyone to owner
    return targetRole !== "owner";
  }
  return false;
}

export function hashInviteToken(rawToken: string): string {
  return createHash("sha256").update(rawToken.trim()).digest("hex");
}

export function generateInviteToken(): { rawToken: string; tokenHash: string } {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashInviteToken(rawToken);
  return { rawToken, tokenHash };
}
