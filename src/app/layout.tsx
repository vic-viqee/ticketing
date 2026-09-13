import Link from "next/link";
import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Sans, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/toast";
import { BrandMark } from "@/components/brand-mark";
import "./globals.css";

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
});

const sans = Instrument_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tikiti — Kenyan Events Ticketing",
  description: "Browse events, buy tickets with M-Pesa, and check in at events.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
          <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between gap-4">
            <Link
              href="/"
              className="flex items-center gap-2.5 font-display text-xl font-extrabold tracking-tight text-foreground"
            >
              <BrandMark className="h-8 w-8" />
              Tikiti
            </Link>
            <nav className="flex items-center gap-1.5 text-sm">
              <Link
                href="/events"
                className="rounded-full px-3.5 py-1.5 text-muted-foreground font-medium transition-colors hover:bg-muted hover:text-foreground"
              >
                Events
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full px-3.5 py-1.5 text-muted-foreground font-medium transition-colors hover:bg-muted hover:text-foreground"
              >
                Dashboard
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border">
          <div className="mx-auto max-w-6xl px-4 py-8 flex flex-col items-center gap-1.5 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <BrandMark className="h-5 w-5" />
              <span className="font-display font-bold text-foreground">Tikiti</span>
            </span>
            <p>Karibu tena. Tickets for Kenyan events, paid with M-Pesa.</p>
          </div>
        </footer>
        <Toaster />
      </body>
    </html>
  );
}