import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Sign In to Your Account",
  description:
    "Sign in to IgInbox to manage your Instagram DM automations, view conversations, and track leads from one dashboard.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <Suspense>{children}</Suspense>;
}
