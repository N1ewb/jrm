"use client";

import { useEffect, useState } from "react";
import { DrawerLink } from "./drawer-link";

function SectionLabel({ label }: { label: string }) {
  return (
    <li className="menu-title text-xs text-primary-foreground/60 mt-4 px-4">
      {label}
    </li>
  );
}

function SidebarLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <DrawerLink
        href={href}
        className="text-sm text-primary-foreground hover:bg-primary-foreground/10 active:bg-primary-foreground/20 rounded-lg"
      >
        {children}
      </DrawerLink>
    </li>
  );
}

const userLinks = (
  <>
    <SectionLabel label="Navigation" />
    <SidebarLink href="/protected/user">Dashboard</SidebarLink>
    <SidebarLink href="/protected/all-routes">View Routes</SidebarLink>
    <SidebarLink href="/protected/add-route">Submit a Route</SidebarLink>
    <SidebarLink href="/protected/community-routes">
      Community Routes
    </SidebarLink>
    <SidebarLink href="/protected/landmarks">
      Landmarks
    </SidebarLink>
    <SidebarLink href="/protected/add-landmark">
      Add Landmark
    </SidebarLink>
    <SectionLabel label="Discover" />
    <SidebarLink href="/protected/favorites">Favorites</SidebarLink>
    <SidebarLink href="/protected/trending">Trending</SidebarLink>
    <SectionLabel label="Account" />
    <SidebarLink href="/protected">Settings &amp; Notifications</SidebarLink>
  </>
);

const adminLinks = (
  <>
    <SectionLabel label="Routes" />
    <SidebarLink href="/protected/add-route">Add Route</SidebarLink>
    <SidebarLink href="/protected/all-routes">All Routes</SidebarLink>
    <SidebarLink href="/protected/admin/review-queue">
      Review Queue
    </SidebarLink>
    <SectionLabel label="Discover" />
    <SidebarLink href="/protected/favorites">Favorites</SidebarLink>
    <SidebarLink href="/protected/trending">Trending</SidebarLink>
    <SectionLabel label="Account" />
    <SidebarLink href="/protected">Settings &amp; Notifications</SidebarLink>
    <SectionLabel label="Admin" />
    <SidebarLink href="/protected/admin">Admin Dashboard</SidebarLink>
    <SidebarLink href="/protected/admin/flagged-content">Flagged Content</SidebarLink>
    <SidebarLink href="/protected/admin/moderation">Moderation</SidebarLink>
    <SidebarLink href="/protected/admin/appeals">Appeals</SidebarLink>
    <SectionLabel label="Community" />
    <SidebarLink href="/protected/support">Support Us</SidebarLink>
  </>
);

function getRoleFromCookie(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)user-role=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export default function SidebarContent() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setRole(getRoleFromCookie());
  }, []);

  return (
    <ul className="menu bg-primary min-h-full w-80 p-4 gap-2 text-primary-foreground">
      {!role ? (
        <li className="px-4 py-8 flex items-center justify-center">
          <span className="animate-spin w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" />
        </li>
      ) : role === "admin" || role === "gov_official" ? (
        adminLinks
      ) : (
        userLinks
      )}
    </ul>
  );
}
