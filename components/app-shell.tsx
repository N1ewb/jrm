"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Route,
  PlusCircle,
  Users,
  Settings,
  ClipboardList,
  Shield,
  Heart,
  Map,
  Home,
  Landmark,
  MapPin,
  Menu,
  X,
  TrendingUp,
} from "lucide-react";

function NavItem({
  href,
  icon: Icon,
  label,
  current,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  current: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        className={`text-sm rounded-lg flex items-center gap-3 px-4 py-2.5 transition-colors ${
          current
            ? "bg-primary-foreground/15 text-primary-foreground font-medium"
            : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
        }`}
      >
        <Icon size={18} className="shrink-0" />
        {label}
      </Link>
    </li>
  );
}

function NavSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <li className="menu-title text-xs text-primary-foreground/60 mt-4 first:mt-0 px-4">
        {label}
      </li>
      {children}
    </>
  );
}

function AdminSidebar({ pathname }: { pathname: string }) {
  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");
  return (
    <>
      <NavSection label="Routes">
        <NavItem
          href="/protected/add-route"
          icon={PlusCircle}
          label="Add Route"
          current={isActive("/protected/add-route")}
        />
        <NavItem
          href="/protected/all-routes"
          icon={Route}
          label="All Routes"
          current={isActive("/protected/all-routes")}
        />
        <NavItem
          href="/protected/review-routes"
          icon={ClipboardList}
          label="Review Community Routes"
          current={isActive("/protected/review-routes")}
        />
      </NavSection>
      <NavSection label="Landmarks">
        <NavItem
          href="/protected/landmarks"
          icon={Landmark}
          label="Landmarks"
          current={isActive("/protected/landmarks")}
        />
        <NavItem
          href="/protected/add-landmark"
          icon={MapPin}
          label="Add Landmark"
          current={isActive("/protected/add-landmark")}
        />
      </NavSection>
      <NavSection label="Discover">
        <NavItem
          href="/protected/favorites"
          icon={Heart}
          label="Favorites"
          current={isActive("/protected/favorites")}
        />
        <NavItem
          href="/protected/trending"
          icon={TrendingUp}
          label="Trending"
          current={isActive("/protected/trending")}
        />
      </NavSection>
      <NavSection label="Account">
        <NavItem
          href="/protected/settings"
          icon={Settings}
          label="Settings &amp; Notifications"
          current={isActive("/protected/settings")}
        />
      </NavSection>
      <NavSection label="Admin">
        <NavItem
          href="/protected/admin"
          icon={Shield}
          label="Admin Dashboard"
          current={isActive("/protected/admin")}
        />
      </NavSection>
      <NavSection label="Community">
        <NavItem
          href="/protected/support"
          icon={Heart}
          label="Support Us"
          current={isActive("/protected/support")}
        />
      </NavSection>
    </>
  );
}

function UserSidebar({ pathname }: { pathname: string }) {
  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");
  return (
    <>
      <NavSection label="Navigation">
        <NavItem
          href="/protected/user"
          icon={Map}
          label="Dashboard"
          current={isActive("/protected/user")}
        />
        <NavItem
          href="/protected/all-routes"
          icon={Route}
          label="View Routes"
          current={isActive("/protected/all-routes")}
        />
        <NavItem
          href="/protected/add-route"
          icon={PlusCircle}
          label="Submit a Route"
          current={isActive("/protected/add-route")}
        />
        <NavItem
          href="/protected/community-routes"
          icon={Users}
          label="Community Routes"
          current={isActive("/protected/community-routes")}
        />
      </NavSection>
      <NavSection label="Landmarks">
        <NavItem
          href="/protected/landmarks"
          icon={Landmark}
          label="Landmarks"
          current={isActive("/protected/landmarks")}
        />
        <NavItem
          href="/protected/add-landmark"
          icon={MapPin}
          label="Add Landmark"
          current={isActive("/protected/add-landmark")}
        />
      </NavSection>
      <NavSection label="Discover">
        <NavItem
          href="/protected/favorites"
          icon={Heart}
          label="Favorites"
          current={isActive("/protected/favorites")}
        />
        <NavItem
          href="/protected/trending"
          icon={TrendingUp}
          label="Trending"
          current={isActive("/protected/trending")}
        />
      </NavSection>
      <NavSection label="Account">
        <NavItem
          href="/protected/settings"
          icon={Settings}
          label="Settings &amp; Notifications"
          current={isActive("/protected/settings")}
        />
      </NavSection>
      <NavSection label="Community">
        <NavItem
          href="/protected/support"
          icon={Heart}
          label="Support Us"
          current={isActive("/protected/support")}
        />
      </NavSection>
    </>
  );
}

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)user-role=([^;]*)/);
    setRole(match ? decodeURIComponent(match[1]) : "user");
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const isAdmin = role === "admin" || role === "gov_official";

  const sidebar = (
    <ul className="menu gap-2 text-primary-foreground">
      {isAdmin ? (
        <AdminSidebar pathname={pathname} />
      ) : (
        <UserSidebar pathname={pathname} />
      )}
    </ul>
  );

  if (!role) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className="animate-spin w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-1">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-80 bg-primary shrink-0 overflow-y-auto">
        <div className="p-4 pt-4">
          {sidebar}
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-80 max-w-[80vw] bg-primary h-full overflow-y-auto shadow-xl">
            <div className="flex items-center justify-end p-4">
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="text-primary-foreground/70 hover:text-primary-foreground"
                aria-label="Close menu"
              >
                <X size={22} />
              </button>
            </div>
            <div className="px-4 pb-8">
              {sidebar}
            </div>
          </aside>
        </div>
      )}

      <main className="flex-1 min-w-0 p-5 pb-20 lg:pb-5">{children}</main>

      {/* Mobile bottom nav – user */}
      {!isAdmin && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-primary text-primary-foreground border-t border-primary-foreground/10">
          <div className="flex justify-around items-center h-16 px-2">
            <Link
              href="/protected/user"
              className="flex flex-col items-center gap-0.5 text-[10px] font-medium"
            >
              <Home size={20} />
              <span>Home</span>
            </Link>
            <Link
              href="/protected/all-routes"
              className="flex flex-col items-center gap-0.5 text-[10px] font-medium"
            >
              <Route size={20} />
              <span>Routes</span>
            </Link>
            <Link
              href="/protected/community-routes"
              className="flex flex-col items-center gap-0.5 text-[10px] font-medium"
            >
              <Users size={20} />
              <span>Community</span>
            </Link>
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex flex-col items-center gap-0.5 text-[10px] font-medium text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              aria-label="Open menu"
            >
              <Menu size={20} />
              <span>Menu</span>
            </button>
          </div>
        </nav>
      )}

      {/* Mobile bottom nav – admin */}
      {isAdmin && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-primary text-primary-foreground border-t border-primary-foreground/10">
          <div className="flex justify-around items-center h-16 px-2">
            <Link
              href="/protected/admin"
              className="flex flex-col items-center gap-0.5 text-[10px] font-medium"
            >
              <Shield size={20} />
              <span>Admin</span>
            </Link>
            <Link
              href="/protected/add-route"
              className="flex flex-col items-center gap-0.5 text-[10px] font-medium"
            >
              <PlusCircle size={20} />
              <span>Add Route</span>
            </Link>
            <Link
              href="/protected/all-routes"
              className="flex flex-col items-center gap-0.5 text-[10px] font-medium"
            >
              <Route size={20} />
              <span>Routes</span>
            </Link>
            <Link
              href="/protected/review-routes"
              className="flex flex-col items-center gap-0.5 text-[10px] font-medium"
            >
              <ClipboardList size={20} />
              <span>Review</span>
            </Link>
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex flex-col items-center gap-0.5 text-[10px] font-medium text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              aria-label="Open menu"
            >
              <Menu size={20} />
              <span>Menu</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
