import Link from "next/link";
import { DrawerLink } from "@/components/drawer-link";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-80 bg-primary shrink-0 overflow-y-auto">
        <div className="p-4 pt-4">
          <ul className="menu gap-2 text-primary-foreground">
            <li className="menu-title text-xs text-primary-foreground/60 px-4">
              Navigation
            </li>
            <li>
              <DrawerLink
                href="/protected/user"
                className="text-sm text-primary-foreground hover:bg-primary-foreground/10 active:bg-primary-foreground/20 rounded-lg"
              >
                Dashboard
              </DrawerLink>
            </li>
            <li>
              <DrawerLink
                href="/protected/add-route"
                className="text-sm text-primary-foreground hover:bg-primary-foreground/10 active:bg-primary-foreground/20 rounded-lg"
              >
                Submit a Route
              </DrawerLink>
            </li>
            <li>
              <DrawerLink
                href="/protected/community-routes"
                className="text-sm text-primary-foreground hover:bg-primary-foreground/10 active:bg-primary-foreground/20 rounded-lg"
              >
                Community Routes
              </DrawerLink>
            </li>
            <li className="menu-title text-xs text-primary-foreground/60 mt-4 px-4">
              Account
            </li>
            <li>
              <DrawerLink
                href="/protected/settings"
                className="text-sm text-primary-foreground hover:bg-primary-foreground/10 active:bg-primary-foreground/20 rounded-lg"
              >
                Settings &amp; Notifications
              </DrawerLink>
            </li>
            <li className="menu-title text-xs text-primary-foreground/60 mt-4 px-4">
              Community
            </li>
            <li>
              <DrawerLink
                href="/protected/support"
                className="text-sm text-primary-foreground hover:bg-primary-foreground/10 active:bg-primary-foreground/20 rounded-lg"
              >
                Support Us
              </DrawerLink>
            </li>
          </ul>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-5 pb-20 lg:pb-5">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-primary text-primary-foreground border-t border-primary-foreground/10">
        <div className="flex justify-around items-center h-16 px-2">
          <Link
            href="/protected/user"
            className="flex flex-col items-center gap-0.5 text-[10px] font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span>Dashboard</span>
          </Link>
          <Link
            href="/protected/add-route"
            className="flex flex-col items-center gap-0.5 text-[10px] font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>Add Route</span>
          </Link>
          <Link
            href="/protected/all-routes"
            className="flex flex-col items-center gap-0.5 text-[10px] font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>Routes</span>
          </Link>
          <Link
            href="/protected/community-routes"
            className="flex flex-col items-center gap-0.5 text-[10px] font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span>Community</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
