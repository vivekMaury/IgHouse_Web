import { connection } from "next/server";
import type { Metadata } from "next";

export const instant = false;

export const metadata: Metadata = {
  title: "Inbox",
};

export default async function InboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  return children;
}
