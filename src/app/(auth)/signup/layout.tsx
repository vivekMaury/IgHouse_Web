import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create your free IgHouse account and start automating Instagram DMs and comments.",
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
