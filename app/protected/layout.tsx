import { Header } from "@/components/header";
import Link from "next/link";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="drawer">
      <input id="protected-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col min-h-dvh">
        <Header />
        <main className="flex-1 w-full flex flex-col p-5">
          <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col">
            {children}
          </div>
        </main>
      </div>
      <div className="drawer-side z-30">
        <label
          htmlFor="protected-drawer"
          aria-label="close sidebar"
          className="drawer-overlay"
        />
        <ul className="menu bg-primary min-h-full w-80 p-4 gap-2 text-primary-foreground">
          <li className="menu-title text-xs text-primary-foreground/60">
            Routes
          </li>
          <li>
            <Link
              href="/protected/add-route"
              className="text-sm text-primary-foreground hover:bg-primary-foreground/10 active:bg-primary-foreground/20 rounded-lg"
            >
              Add Route
            </Link>
          </li>
          <li>
            <Link
              href="/protected/all-routes"
              className="text-sm text-primary-foreground hover:bg-primary-foreground/10 active:bg-primary-foreground/20 rounded-lg"
            >
              All Routes
            </Link>
          </li>
          <li>
            <Link
              href="/protected/review-routes"
              className="text-sm text-primary-foreground hover:bg-primary-foreground/10 active:bg-primary-foreground/20 rounded-lg"
            >
              Review Community Routes
            </Link>
          </li>
          <li className="menu-title text-xs text-primary-foreground/60 mt-4">
            Account
          </li>
          <li>
            <Link
              href="/protected"
              className="text-sm text-primary-foreground hover:bg-primary-foreground/10 active:bg-primary-foreground/20 rounded-lg"
            >
              Settings &amp; Notifications
            </Link>
          </li>
          <li className="menu-title text-xs text-primary-foreground/60 mt-4">
            Admin
          </li>
          <li>
            <Link
              href="/protected/admin"
              className="text-sm text-primary-foreground hover:bg-primary-foreground/10 active:bg-primary-foreground/20 rounded-lg"
            >
              Admin Dashboard
            </Link>
          </li>
          <li className="menu-title text-xs text-primary-foreground/60 mt-4">
            Community
          </li>
          <li>
            <Link
              href="/protected/support"
              className="text-sm text-primary-foreground hover:bg-primary-foreground/10 active:bg-primary-foreground/20 rounded-lg"
            >
              Support Us
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
