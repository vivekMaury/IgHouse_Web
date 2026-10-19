import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ig-house-web.vercel.app"),
  title: {
    default: "IgHouse — Instagram DM & Comment Automation",
    template: "%s | IgHouse",
  },
  description:
    "Turn Instagram comments into automated sales funnels with visual flows, DM automation, and a shared inbox.",
  openGraph: {
    title: "IgHouse — Instagram DM & Comment Automation",
    description:
      "Build visual flows that reply to comments, send DMs, capture leads, and qualify prospects — all on autopilot.",
    url: "https://ig-house-web.vercel.app",
    siteName: "IgHouse",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "IgHouse — Instagram DM & Comment Automation",
    description:
      "Build visual flows that reply to comments, send DMs, capture leads, and qualify prospects — all on autopilot.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
