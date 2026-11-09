import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Your Free Account",
  description:
    "Sign up for IgInbox free and start automating Instagram DMs, comment replies, and lead capture in minutes. No credit card required.",
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
