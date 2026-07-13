"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Map,
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
  Landmark,
  MapPin,
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

function NavSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <li className="menu-title text-xs text-primary-foreground/60 mt-4 first:mt-0 px-4">
        {label}
      </li>
      {children}
    </>
  );
}

export default function Sidebar({
  sidebarOpen,
  onClose,
}: {
  sidebarOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [transitionIn, setTransitionIn] = useState(false);

  useEffect(() => {
    if (sidebarOpen) {
      setMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setTransitionIn(true));
      });
    } else {
      setTransitionIn(false);
      const timer = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [sidebarOpen]);

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

  const isActive = (path: string) => pathname === path;

  if (!role) {
    return (
      <ul className="menu bg-primary min-h-full w-80 p-4 gap-2 text-primary-foreground">
        <li className="px-4 py-8 flex items-center justify-center">
          <span className="animate-spin w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" />
        </li>
      </ul>
    );
  }

  const isAdmin = role === "admin" || role === "gov_official";

  return (
    <>
      {/* Mobile overlay */}
      {mounted && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className={`absolute inset-0 transition-opacity duration-300 ${
              transitionIn ? "opacity-100" : "opacity-0"
            } bg-black/40`}
            onClick={onClose}
          />
          <div
            className={`absolute left-0 top-0 h-full transition-transform duration-300 ease-out ${
              transitionIn ? "translate-x-0" : "-translate-x-full"
            } w-80 max-w-[80vw] bg-primary p-4 shadow-xl overflow-y-auto`}
          >
            <ul className="menu w-full gap-2 text-primary-foreground">
              {isAdmin ? <AdminItems pathname={pathname} /> : <UserItems pathname={pathname} />}
            </ul>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <ul className="menu bg-primary min-h-full w-80 p-4 gap-2 text-primary-foreground hidden lg:block">
        {isAdmin ? <AdminItems pathname={pathname} /> : <UserItems pathname={pathname} />}
      </ul>
    </>
  );
}

function UserItems({ pathname }: { pathname: string }) {
  return (
    <>
      <NavSection label="Navigation">
        <NavItem href="/protected/user" icon={Map} label="Dashboard" current={pathname === "/protected/user"} />
        <NavItem href="/protected/all-routes" icon={Route} label="View Routes" current={pathname === "/protected/all-routes"} />
        <NavItem href="/protected/add-route" icon={PlusCircle} label="Submit a Route" current={pathname === "/protected/add-route"} />
        <NavItem href="/protected/community-routes" icon={Users} label="Community Routes" current={pathname === "/protected/community-routes"} />
      </NavSection>
      <NavSection label="Landmarks">
        <NavItem href="/protected/landmarks" icon={Landmark} label="Landmarks" current={pathname === "/protected/landmarks"} />
        <NavItem href="/protected/add-landmark" icon={MapPin} label="Add Landmark" current={pathname === "/protected/add-landmark"} />
      </NavSection>
      <NavSection label="Discover">
        <NavItem href="/protected/favorites" icon={Heart} label="Favorites" current={pathname === "/protected/favorites"} />
        <NavItem href="/protected/trending" icon={TrendingUp} label="Trending" current={pathname === "/protected/trending"} />
      </NavSection>
      <NavSection label="Account">
        <NavItem href="/protected" icon={Settings} label="Settings & Notifications" current={pathname === "/protected"} />
      </NavSection>
    </>
  );
}

function AdminItems({ pathname }: { pathname: string }) {
  return (
    <>
      <NavSection label="Routes">
        <NavItem href="/protected/add-route" icon={PlusCircle} label="Add Route" current={pathname === "/protected/add-route"} />
        <NavItem href="/protected/all-routes" icon={Route} label="All Routes" current={pathname === "/protected/all-routes"} />
        <NavItem href="/protected/review-routes" icon={ClipboardList} label="Review Community Routes" current={pathname === "/protected/review-routes"} />
      </NavSection>
      <NavSection label="Discover">
        <NavItem href="/protected/favorites" icon={Heart} label="Favorites" current={pathname === "/protected/favorites"} />
        <NavItem href="/protected/trending" icon={TrendingUp} label="Trending" current={pathname === "/protected/trending"} />
      </NavSection>
      <NavSection label="Account">
        <NavItem href="/protected" icon={Settings} label="Settings & Notifications" current={pathname === "/protected"} />
      </NavSection>
      <NavSection label="Admin">
        <NavItem href="/protected/admin" icon={Shield} label="Admin Dashboard" current={pathname === "/protected/admin"} />
        <NavItem href="/protected/admin/flagged-content" icon={Flag} label="Flagged Content" current={pathname === "/protected/admin/flagged-content"} />
        <NavItem href="/protected/admin/moderation" icon={ShieldAlert} label="Moderation" current={pathname === "/protected/admin/moderation"} />
        <NavItem href="/protected/admin/appeals" icon={MessageCircle} label="Appeals" current={pathname === "/protected/admin/appeals"} />
      </NavSection>
      <NavSection label="Community">
        <NavItem href="/protected/support" icon={Heart} label="Support Us" current={pathname === "/protected/support"} />
      </NavSection>
    </>
  );
}
