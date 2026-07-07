import { Header } from "@/components/header";
import { DrawerLink } from "@/components/drawer-link";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="drawer lg:drawer-open">
      <input id="protected-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col min-h-dvh">
        <Header />
        <main className="flex-1 w-full flex flex-col px-5 py-3">
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
              href="/protected/all-routes"
              className="text-sm text-primary-foreground hover:bg-primary-foreground/10 active:bg-primary-foreground/20 rounded-lg"
            >
              View Routes
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
          <li className="menu-title text-xs text-primary-foreground/60 mt-4">
            Account
          </li>
          <li>
            <DrawerLink
              href="/protected"
              className="text-sm text-primary-foreground hover:bg-primary-foreground/10 active:bg-primary-foreground/20 rounded-lg"
            >
              Settings &amp; Notifications
            </DrawerLink>
          </li>
          <li className="menu-title text-xs text-primary-foreground/60 mt-4">
            Admin
          </li>
          <li>
            <DrawerLink
              href="/protected/admin"
              className="text-sm text-primary-foreground hover:bg-primary-foreground/10 active:bg-primary-foreground/20 rounded-lg"
            >
              Admin Dashboard
            </DrawerLink>
          </li>
          <li>
            <DrawerLink
              href="/protected/review-routes"
              className="text-sm text-primary-foreground hover:bg-primary-foreground/10 active:bg-primary-foreground/20 rounded-lg"
            >
              Review Community Routes
            </DrawerLink>
          </li>
          <li className="menu-title text-xs text-primary-foreground/60 mt-4">
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
    </div>
  );
}
