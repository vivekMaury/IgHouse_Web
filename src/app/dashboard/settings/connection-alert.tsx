"use client";

import { useState } from "react";
import { X, CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";

const ERROR_MESSAGES: Record<
  string,
  { title: string; message: string; variant: "error" | "warning" }
> = {
  personal_account: {
    title: "Business or Creator account required",
    message:
      "Your Instagram account is a Personal account. Please switch it to a Business or Creator account in Instagram Settings → Account → Switch to Professional Account, then try connecting again.",
    variant: "warning",
  },
  no_facebook_page: {
    title: "Facebook Page not linked",
    message:
      "Your Instagram account is not linked to a Facebook Page. Please link them in Meta Business Suite → Settings → Accounts → Instagram, then try connecting again.",
    variant: "warning",
  },
  permissions_denied: {
    title: "Required permissions not granted",
    message:
      "You need to allow all requested permissions (messaging, comments, and basic access) for IgInbox to work. Please try again and accept all permission prompts.",
    variant: "error",
  },
  instagram_auth_denied: {
    title: "Authorization denied",
    message: "Instagram authorization was cancelled or denied. Please try again.",
    variant: "error",
  },
  token_exchange_failed: {
    title: "Authentication failed",
    message:
      "Instagram could not validate the token exchange. Check that the Instagram App ID and client secret belong to the same Meta app configured for Instagram Login, and that the redirect URI matches exactly. Then try again.",
    variant: "error",
  },
  db_save_failed: {
    title: "Failed to save account",
    message: "Could not save your Instagram connection. Please try again.",
    variant: "error",
  },
  webhook_subscription_failed: {
    title: "Webhook setup failed",
    message:
      "Could not enable Instagram message notifications. Check that the Meta app is Live and the messages webhook field is configured, then reconnect the account.",
    variant: "error",
  },
  encryption_failed: {
    title: "Server error",
    message: "A server encryption error occurred. Please contact support.",
    variant: "error",
  },
  profile_fetch_failed: {
    title: "Profile fetch failed",
    message:
      "Could not retrieve your Instagram profile. Please ensure your account is a Business or Creator account and try again.",
    variant: "error",
  },
  missing_ig_business_id: {
    title: "Business account not found",
    message:
      "Could not find your Instagram Business Account ID. Please ensure your Instagram account is properly set up as a Business or Creator account.",
    variant: "error",
  },
  missing_params: {
    title: "Incomplete response from Instagram",
    message:
      "Instagram did not return the required authorization data. This can happen if the page was refreshed mid-flow. Please try connecting again.",
    variant: "error",
  },
  missing_state_cookie: {
    title: "Session expired",
    message:
      "Your connection session expired or your browser blocked the required cookie. Please make sure third-party cookies are allowed for this site, then try again.",
    variant: "warning",
  },
  state_mismatch: {
    title: "Security check failed",
    message:
      "The connection request could not be verified — this can happen if you used an old or duplicate tab. Please close all IgInbox tabs and try connecting from a fresh page.",
    variant: "error",
  },
  invalid_state: {
    title: "Invalid session",
    message:
      "The connection session data was incomplete. Please try connecting your Instagram account again.",
    variant: "error",
  },
  server_config: {
    title: "Server configuration error",
    message:
      "The server is missing required configuration. Please contact support if this persists.",
    variant: "error",
  },
  workspace_access_failed: {
    title: "Workspace could not be verified",
    message:
      "We could not verify your workspace membership. Please try again, and contact support if the problem persists.",
    variant: "error",
  },
  workspace_access_denied: {
    title: "Workspace access denied",
    message:
      "Your account no longer has access to the workspace that started this connection. Refresh the settings page and try again.",
    variant: "error",
  },
};

export function ConnectionAlert({
  connected,
  error,
}: {
  connected: boolean;
  error: string | null;
}) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  if (connected) {
    return (
      <div className="relative flex items-start gap-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
        <p className="text-sm text-emerald-600">
          Instagram account connected successfully.
        </p>
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-2 top-2 rounded-sm p-1 text-emerald-500/70 transition-colors hover:text-emerald-600"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  if (!error) return null;

  const known = ERROR_MESSAGES[error];
  const title = known?.title ?? "Connection error";
  const message = known?.message ?? `An unexpected error occurred (${error}). Please try again.`;
  const variant = known?.variant ?? "error";

  const isWarning = variant === "warning";
  const Icon = isWarning ? AlertTriangle : XCircle;
  const borderColor = isWarning ? "border-amber-500/30" : "border-destructive/30";
  const bgColor = isWarning ? "bg-amber-500/10" : "bg-destructive/10";
  const iconColor = isWarning ? "text-amber-500" : "text-destructive";
  const titleColor = isWarning ? "text-amber-700 dark:text-amber-400" : "text-destructive";
  const textColor = isWarning ? "text-amber-600 dark:text-amber-300/90" : "text-destructive/90";
  const dismissColor = isWarning
    ? "text-amber-500/70 hover:text-amber-600"
    : "text-destructive/50 hover:text-destructive";

  return (
    <div className={`relative flex items-start gap-3 rounded-md border ${borderColor} ${bgColor} px-4 py-3`}>
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconColor}`} />
      <div className="min-w-0 flex-1 pr-6">
        <p className={`text-sm font-medium ${titleColor}`}>{title}</p>
        <p className={`mt-1 text-sm ${textColor}`}>{message}</p>
        {isWarning && (
          <div className={`mt-2 flex items-center gap-1.5 text-xs ${textColor}`}>
            <Info className="h-3 w-3" />
            <span>Need help? Check Instagram&apos;s help center for account setup guides.</span>
          </div>
        )}
      </div>
      <button
        onClick={() => setDismissed(true)}
        className={`absolute right-2 top-2 rounded-sm p-1 transition-colors ${dismissColor}`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
