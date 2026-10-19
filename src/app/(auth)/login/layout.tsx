import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your IgHouse account to manage Instagram automation flows.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
