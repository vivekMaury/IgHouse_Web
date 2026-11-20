"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/browser";
import { Users, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";

function InviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<{
    workspaceName: string;
    email: string;
    role: string;
  } | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuthAndInvite() {
      if (!token) {
        setError("Missing invitation token");
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setCurrentUser(session?.user?.email ?? null);

        const res = await fetch(`/api/workspaces/invites/verify?token=${encodeURIComponent(token)}`);
        const json = await res.json();

        if (!res.ok) {
          setError(json.error || "Invalid invitation");
        } else {
          setInviteData(json);
        }
      } catch {
        setError("Failed to verify invitation. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    checkAuthAndInvite();
  }, [token]);

  const handleAccept = useCallback(async () => {
    if (!token) return;
    setAccepting(true);
    try {
      const res = await fetch("/api/workspaces/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to join workspace");
        return;
      }

      toast.success("Joined workspace successfully!");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Network error while accepting invitation");
    } finally {
      setAccepting(false);
    }
  }, [token, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Loader2 className="size-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">Verifying invitation...</p>
      </div>
    );
  }

  if (error || !inviteData) {
    return (
      <Card className="w-full max-w-md border-border/60 shadow-xl bg-card">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="size-6" />
          </div>
          <CardTitle className="text-xl">Invalid Invitation</CardTitle>
          <CardDescription className="text-sm mt-1">{error}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Link href="/login" className={buttonVariants({ variant: "outline" })}>
            Return to Login
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-border/60 shadow-xl bg-card">
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Users className="size-6" />
        </div>
        <CardTitle className="text-xl font-bold">You&apos;re Invited!</CardTitle>
        <CardDescription className="text-sm mt-1">
          Join <strong className="text-foreground">{inviteData.workspaceName}</strong> on IgInbox
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="rounded-xl border border-border/50 bg-muted/40 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Invited as</span>
            <Badge variant="secondary" className="capitalize font-semibold text-primary">
              {inviteData.role}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Sent to</span>
            <span className="font-mono text-foreground font-medium">{inviteData.email}</span>
          </div>
        </div>

        {currentUser ? (
          <div className="space-y-4">
            <p className="text-xs text-center text-muted-foreground">
              Signed in as <strong className="text-foreground">{currentUser}</strong>
            </p>
            <Button
              onClick={handleAccept}
              disabled={accepting}
              className="w-full font-semibold"
              size="lg"
            >
              {accepting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Joining Workspace...
                </>
              ) : (
                <>
                  Accept & Join Workspace
                  <ArrowRight className="ml-2 size-4" />
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-center text-muted-foreground">
              Please log in or create an account with <strong>{inviteData.email}</strong> to join this workspace.
            </p>
            <Link
              href={`/login?redirect=${encodeURIComponent(`/invite?token=${token}`)}`}
              className={cn(buttonVariants({ size: "lg" }), "w-full font-semibold")}
            >
              Log In to Accept
            </Link>
            <Link
              href={`/signup?redirect=${encodeURIComponent(`/invite?token=${token}`)}`}
              className={cn(buttonVariants({ variant: "outline" }), "w-full")}
            >
              Create New Account
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function InvitePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <Link href="/" className="mb-8">
        <BrandLogo size="lg" variant="auto" />
      </Link>
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-8">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        }
      >
        <InviteContent />
      </Suspense>
    </div>
  );
}
