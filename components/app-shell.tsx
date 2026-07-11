"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AdminMobileNav from "@/components/admin-mobile-nav";
import {
  LayoutDashboard,
  Route,
  PlusCircle,
  Users,
  Settings,
  ClipboardList,
  Shield,
  ShieldAlert,
  Flag,
  MessageCircle,
  Heart,
  Map,
  Home,
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
  const isActive = (path: string) => pathname === path;
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
        <NavItem
          href="/protected/admin/flagged-content"
          icon={Flag}
          label="Flagged Content"
          current={isActive("/protected/admin/flagged-content")}
        />
        <NavItem
          href="/protected/admin/moderation"
          icon={ShieldAlert}
          label="Moderation"
          current={isActive("/protected/admin/moderation")}
        />
        <NavItem
          href="/protected/admin/appeals"
          icon={MessageCircle}
          label="Appeals"
          current={isActive("/protected/admin/appeals")}
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
  const isActive = (path: string) => pathname === path;
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
      <NavSection label="Account">
        <NavItem
          href="/protected/settings"
          icon={Settings}
          label="Settings &amp; Notifications"
          current={isActive("/protected/settings")}
        />
      </NavSection>
    </>
  );
}

function UserMobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-primary text-primary-foreground border-t border-primary-foreground/10">
      <div className="flex justify-around items-center h-16 px-2">
        <Link
          href="/protected/user"
          className="flex flex-col items-center gap-0.5 text-[10px] font-medium"
        >
          <Home size={20} />
          <span>Dashboard</span>
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
          href="/protected/community-routes"
          className="flex flex-col items-center gap-0.5 text-[10px] font-medium"
        >
          <Users size={20} />
          <span>Community</span>
        </Link>
      </div>
    </nav>
  );
}

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRole() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        setRole(data?.role ?? "user");
      }
    }
    fetchRole();
  }, []);

  const isAdmin = role === "admin" || role === "gov_official";

  if (!role) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className="animate-spin w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-1">
      <aside className="hidden lg:block w-80 bg-primary shrink-0 overflow-y-auto">
        <div className="p-4 pt-4">
          <ul className="menu gap-2 text-primary-foreground">
            {isAdmin ? (
              <AdminSidebar pathname={pathname} />
            ) : (
              <UserSidebar pathname={pathname} />
            )}
          </ul>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-5 pb-20 lg:pb-5">{children}</main>

      {isAdmin ? <AdminMobileNav /> : <UserMobileNav />}
    </div>
  );
}
