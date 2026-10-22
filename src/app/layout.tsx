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
