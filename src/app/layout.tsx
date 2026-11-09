import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://iginbox.com"),
  title: {
    default: "IgInbox — Instagram DM & Comment Automation Platform",
    template: "%s | IgInbox",
  },
  description:
    "Automate Instagram DMs, comment replies, and story mentions with visual drag-and-drop flows. Capture leads, qualify prospects, and close sales — all on autopilot. Free plan available.",
  keywords: [
    "Instagram automation",
    "Instagram DM automation",
    "comment automation",
    "Instagram chatbot",
    "Instagram marketing tool",
    "DM funnel",
    "Instagram lead generation",
    "ManyChat alternative",
    "Instagram auto reply",
    "social media automation",
  ],
  icons: {
    icon: [
      { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "IgInbox — Automate Instagram DMs, Comments & Story Replies",
    description:
      "Build visual flows that reply to comments, send DMs, capture leads, and qualify prospects — all on autopilot. Trusted by creators and brands.",
    url: "https://iginbox.com",
    siteName: "IgInbox",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "IgInbox — Automate Instagram DMs, Comments & Story Replies",
    description:
      "Build drag-and-drop flows that auto-reply to comments, send DMs, capture leads, and qualify prospects. Free plan available.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://iginbox.com",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${jakarta.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
