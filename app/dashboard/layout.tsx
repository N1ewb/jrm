import type { Metadata } from "next";
import Link from "next/link";
import { MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard - JRM",
  description: "Jeep Route Maps dashboard",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-dvh w-dvw overflow-hidden bg-background flex flex-col">
      {/* Desktop header only */}
      <header className="hidden md:flex h-12 shrink-0 items-center justify-between px-4 border-b border-border bg-card z-30">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <MapPin size={14} className="text-primary-foreground" />
          </div>
          <span className="font-bold text-sm text-primary">JRM</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/dashboard"
            className="px-3 py-1 rounded-md bg-primary text-primary-foreground font-medium text-xs"
          >
            Map
          </Link>
          <Link
            href="/protected"
            className="px-3 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-xs"
          >
            Account
          </Link>
        </nav>
      </header>

      <main className="flex-1 relative overflow-hidden">{children}</main>
    </div>
  );
}
