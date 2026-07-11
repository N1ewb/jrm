import { DrawerLink } from "@/components/drawer-link";
import AdminMobileNav from "@/components/admin-mobile-nav";

export default function AdminLayout({
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
              Routes
            </li>
            <li>
              <DrawerLink
                href="/protected/add-route"
                className="text-sm text-primary-foreground hover:bg-primary-foreground/10 active:bg-primary-foreground/20 rounded-lg"
              >
                Add Route
              </DrawerLink>
            </li>
            <li>
              <DrawerLink
                href="/protected/all-routes"
                className="text-sm text-primary-foreground hover:bg-primary-foreground/10 active:bg-primary-foreground/20 rounded-lg"
              >
                All Routes
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
                href="/protected/admin/flagged-content"
                className="text-sm text-primary-foreground hover:bg-primary-foreground/10 active:bg-primary-foreground/20 rounded-lg"
              >
                Flagged Content
              </DrawerLink>
            </li>
            <li>
              <DrawerLink
                href="/protected/admin/moderation"
                className="text-sm text-primary-foreground hover:bg-primary-foreground/10 active:bg-primary-foreground/20 rounded-lg"
              >
                Moderation
              </DrawerLink>
            </li>
            <li>
              <DrawerLink
                href="/protected/admin/appeals"
                className="text-sm text-primary-foreground hover:bg-primary-foreground/10 active:bg-primary-foreground/20 rounded-lg"
              >
                Appeals
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

      <AdminMobileNav />
    </div>
  );
}
