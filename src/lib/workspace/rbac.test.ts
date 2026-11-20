import { describe, it, expect } from "vitest";
import {
  hasPermission,
  canManageRole,
  hashInviteToken,
  generateInviteToken,
  type WorkspaceRole,
} from "./rbac";

describe("Workspace RBAC & Permissions", () => {
  it("gives owner full permissions", () => {
    expect(hasPermission("owner", "manage_workspace_settings")).toBe(true);
    expect(hasPermission("owner", "delete_workspace")).toBe(true);
    expect(hasPermission("owner", "transfer_ownership")).toBe(true);
    expect(hasPermission("owner", "manage_members")).toBe(true);
    expect(hasPermission("owner", "connect_instagram")).toBe(true);
    expect(hasPermission("owner", "send_messages")).toBe(true);
  });

  it("restricts admin from workspace deletion and ownership transfer", () => {
    expect(hasPermission("admin", "manage_workspace_settings")).toBe(false);
    expect(hasPermission("admin", "delete_workspace")).toBe(false);
    expect(hasPermission("admin", "transfer_ownership")).toBe(false);
    expect(hasPermission("admin", "manage_members")).toBe(true);
    expect(hasPermission("admin", "connect_instagram")).toBe(true);
    expect(hasPermission("admin", "send_messages")).toBe(true);
  });

  it("allows member to manage flows and messages but not members or accounts", () => {
    expect(hasPermission("member", "manage_members")).toBe(false);
    expect(hasPermission("member", "connect_instagram")).toBe(false);
    expect(hasPermission("member", "manage_flows")).toBe(true);
    expect(hasPermission("member", "send_messages")).toBe(true);
    expect(hasPermission("member", "read_inbox")).toBe(true);
  });

  it("restricts viewer to read-only actions", () => {
    expect(hasPermission("viewer", "view_flows")).toBe(true);
    expect(hasPermission("viewer", "read_inbox")).toBe(true);
    expect(hasPermission("viewer", "read_contacts")).toBe(true);
    expect(hasPermission("viewer", "read_logs")).toBe(true);

    expect(hasPermission("viewer", "manage_flows")).toBe(false);
    expect(hasPermission("viewer", "send_messages")).toBe(false);
    expect(hasPermission("viewer", "manage_contacts")).toBe(false);
    expect(hasPermission("viewer", "manage_members")).toBe(false);
  });

  it("handles null or undefined role safely", () => {
    expect(hasPermission(null, "view_flows")).toBe(false);
    expect(hasPermission(undefined, "read_logs")).toBe(false);
  });

  it("enforces role management hierarchy", () => {
    // Owner can manage all roles
    expect(canManageRole("owner", "owner")).toBe(true);
    expect(canManageRole("owner", "admin")).toBe(true);
    expect(canManageRole("owner", "member")).toBe(true);
    expect(canManageRole("owner", "viewer")).toBe(true);

    // Admin can manage member and viewer, but NOT owner
    expect(canManageRole("admin", "owner")).toBe(false);
    expect(canManageRole("admin", "admin")).toBe(true);
    expect(canManageRole("admin", "member")).toBe(true);
    expect(canManageRole("admin", "viewer")).toBe(true);

    // Member and viewer cannot manage anyone
    expect(canManageRole("member", "viewer")).toBe(false);
    expect(canManageRole("viewer", "viewer")).toBe(false);
  });

  it("generates and verifies cryptographic invite tokens", () => {
    const { rawToken, tokenHash } = generateInviteToken();
    expect(rawToken).toHaveLength(64);
    expect(tokenHash).toHaveLength(64);
    expect(hashInviteToken(rawToken)).toBe(tokenHash);
  });
});
