"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  UserPlus,
  Mail,
  Copy,
  RefreshCw,
  Trash2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Eye,
  MoreVertical,
  Loader2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { type WorkspaceRole, canManageRole } from "@/lib/workspace/rbac";

interface Member {
  id: string;
  userId: string;
  role: WorkspaceRole;
  email: string;
  name: string;
  createdAt: string;
}

interface Invitation {
  id: string;
  email: string;
  role: WorkspaceRole;
  status: string;
  expires_at: string;
  created_at: string;
}

interface WorkspaceTeamProps {
  workspaceId: string;
  workspaceName: string;
  currentUserRole: WorkspaceRole;
  currentUserId: string;
}

export function WorkspaceTeam({
  workspaceId,
  workspaceName,
  currentUserRole,
  currentUserId,
}: WorkspaceTeamProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite dialog state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member" | "viewer">("member");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [newInviteLink, setNewInviteLink] = useState<string | null>(null);

  const canManage = currentUserRole === "owner" || currentUserRole === "admin";

  const fetchData = useCallback(async () => {
    try {
      const [membersRes, invitesRes] = await Promise.all([
        fetch(`/api/workspaces/${workspaceId}/members`),
        canManage ? fetch(`/api/workspaces/${workspaceId}/invites`) : Promise.resolve(null),
      ]);

      if (membersRes.ok) {
        const mJson = await membersRes.json();
        setMembers(mJson.members || []);
      }

      if (invitesRes && invitesRes.ok) {
        const iJson = await invitesRes.json();
        setInvites(iJson.invites || []);
      }
    } catch {
      toast.error("Failed to load team data");
    } finally {
      setLoading(false);
    }
  }, [workspaceId, canManage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setSendingInvite(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create invite");
        return;
      }

      toast.success("Invitation created successfully!");
      setNewInviteLink(data.invite?.inviteUrl || null);
      setInviteEmail("");
      fetchData();
    } catch {
      toast.error("Network error while creating invite");
    } finally {
      setSendingInvite(false);
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Invite link copied to clipboard!");
  };

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invites/${inviteId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to revoke invite");
        return;
      }
      toast.success("Invitation revoked");
      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
    } catch {
      toast.error("Network error");
    }
  };

  const handleResendInvite = async (inviteId: string) => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invites/${inviteId}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to resend invite");
        return;
      }
      toast.success("New invite link generated!");
      if (data.inviteUrl) {
        navigator.clipboard.writeText(data.inviteUrl);
        toast.info("Copied refreshed invite link to clipboard");
      }
      fetchData();
    } catch {
      toast.error("Network error");
    }
  };

  const handleChangeRole = async (memberId: string, newRole: WorkspaceRole) => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update role");
        return;
      }
      toast.success("Member role updated");
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)),
      );
    } catch {
      toast.error("Network error");
    }
  };

  const handleRemoveMember = async (memberId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from this workspace?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to remove member");
        return;
      }
      toast.success("Member removed from workspace");
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch {
      toast.error("Network error");
    }
  };

  const getRoleBadge = (role: WorkspaceRole) => {
    switch (role) {
      case "owner":
        return (
          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1 font-semibold">
            <ShieldAlert className="size-3" /> Owner
          </Badge>
        );
      case "admin":
        return (
          <Badge className="bg-primary/10 text-primary border-primary/20 gap-1 font-semibold">
            <ShieldCheck className="size-3" /> Admin
          </Badge>
        );
      case "member":
        return (
          <Badge variant="secondary" className="gap-1 font-medium">
            <Shield className="size-3" /> Member
          </Badge>
        );
      case "viewer":
        return (
          <Badge variant="outline" className="gap-1 text-muted-foreground font-medium">
            <Eye className="size-3" /> Viewer
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Workspace Overview Card ── */}
      <Card className="border-border/60 bg-card">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl font-bold">{workspaceName}</CardTitle>
              {getRoleBadge(currentUserRole)}
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              {members.length} team {members.length === 1 ? "member" : "members"} &bull; Role-based access control enabled
            </CardDescription>
          </div>

          {canManage && (
            <Dialog open={inviteOpen} onOpenChange={(open) => {
              setInviteOpen(open);
              if (!open) setNewInviteLink(null);
            }}>
              <DialogTrigger className={cn(buttonVariants(), "gap-2 font-medium cursor-pointer")}>
                <UserPlus className="size-4" />
                Invite Member
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Invite Teammate</DialogTitle>
                  <DialogDescription>
                    Invite an agent, manager, or client to collaborate in {workspaceName}.
                  </DialogDescription>
                </DialogHeader>

                {newInviteLink ? (
                  <div className="space-y-4 py-2">
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                      <p className="text-xs font-semibold text-emerald-400 mb-1">
                        Invitation link generated!
                      </p>
                      <p className="text-xs text-muted-foreground mb-3">
                        Share this link directly with your teammate. It is valid for 7 days.
                      </p>
                      <div className="flex items-center gap-2">
                        <Input
                          readOnly
                          value={newInviteLink}
                          className="font-mono text-xs bg-background/80"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleCopyLink(newInviteLink)}
                          className="shrink-0 gap-1.5"
                        >
                          <Copy className="size-3.5" />
                          Copy
                        </Button>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setNewInviteLink(null);
                          setInviteOpen(false);
                        }}
                      >
                        Done
                      </Button>
                    </DialogFooter>
                  </div>
                ) : (
                  <form onSubmit={handleSendInvite} className="space-y-4 py-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="invite-email">Teammate Email Address</Label>
                      <Input
                        id="invite-email"
                        type="email"
                        placeholder="agent@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="invite-role">Assign Role</Label>
                      <select
                        id="invite-role"
                        value={inviteRole}
                        onChange={(e) =>
                          setInviteRole(e.target.value as "admin" | "member" | "viewer")
                        }
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="member">Member — Can build flows & reply to DMs</option>
                        {currentUserRole === "owner" && (
                          <option value="admin">Admin — Can manage team & connect Instagram</option>
                        )}
                        <option value="viewer">Viewer — Read-only analytics & inbox</option>
                      </select>
                      <p className="text-[11px] text-muted-foreground">
                        {inviteRole === "admin" && "Admins have full access except workspace deletion and billing."}
                        {inviteRole === "member" && "Members can create flows and reply to conversations, but cannot connect accounts."}
                        {inviteRole === "viewer" && "Viewers can view flows, logs, and messages without editing."}
                      </p>
                    </div>

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setInviteOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={sendingInvite}>
                        {sendingInvite ? (
                          <>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Creating Invite...
                          </>
                        ) : (
                          "Create Invitation"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
      </Card>

      {/* ── Active Members List ── */}
      <Card className="border-border/60 bg-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="size-4 text-primary" />
            Team Members ({members.length})
          </CardTitle>
          <CardDescription className="text-xs">
            Users who currently have access to this workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {members.map((member) => {
                const isCurrentUser = member.userId === currentUserId;
                const canEditThisMember =
                  canManage &&
                  !isCurrentUser &&
                  canManageRole(currentUserRole, member.role);

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-xs text-foreground uppercase border border-border/60">
                        {member.name.charAt(0) || member.email.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">
                            {member.name}
                          </p>
                          {isCurrentUser && (
                            <span className="text-[10px] text-muted-foreground font-mono bg-muted/60 px-1.5 py-0.5 rounded">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {member.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {getRoleBadge(member.role)}

                      {canEditThisMember && (
                        <DropdownMenu>
                          <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "size-8 p-0 text-muted-foreground hover:text-foreground cursor-pointer")}>
                            <MoreVertical className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {currentUserRole === "owner" && member.role !== "admin" && (
                              <DropdownMenuItem
                                onClick={() => handleChangeRole(member.id, "admin")}
                              >
                                Promote to Admin
                              </DropdownMenuItem>
                            )}
                            {member.role !== "member" && (
                              <DropdownMenuItem
                                onClick={() => handleChangeRole(member.id, "member")}
                              >
                                Set as Member
                              </DropdownMenuItem>
                            )}
                            {member.role !== "viewer" && (
                              <DropdownMenuItem
                                onClick={() => handleChangeRole(member.id, "viewer")}
                              >
                                Set as Viewer
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleRemoveMember(member.id, member.name)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="size-3.5 mr-2" />
                              Remove from Workspace
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Pending Invitations List (Only for Owner / Admin) ── */}
      {canManage && invites.length > 0 && (
        <Card className="border-border/60 bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Mail className="size-4 text-amber-500" />
              Pending Invitations ({invites.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Invitations waiting to be accepted. Valid for 7 days from generation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border/40">
              {invites.map((invite) => {
                const expiresDate = new Date(invite.expires_at).toLocaleDateString();

                return (
                  <div
                    key={invite.id}
                    className="flex flex-col gap-3 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        <Clock className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {invite.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Expires {expiresDate} &bull; Invited as{" "}
                          <span className="capitalize font-medium text-foreground">
                            {invite.role}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResendInvite(invite.id)}
                        className="gap-1.5 text-xs h-8"
                      >
                        <RefreshCw className="size-3" />
                        Resend & Copy
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeInvite(invite.id)}
                        className="text-destructive hover:bg-destructive/10 text-xs h-8"
                      >
                        Revoke
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
