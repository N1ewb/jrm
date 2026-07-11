"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DrawerLink } from "@/components/drawer-link";
import { LayoutDashboard, Menu, X, Flag, ShieldAlert, MessageCircle, Route, PlusCircle, Settings, Heart } from "lucide-react";

export default function AdminMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [transitionIn, setTransitionIn] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setTransitionIn(true));
      });
    } else {
      setTransitionIn(false);
      const timer = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile sidebar drawer */}
      {mounted && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className={`absolute inset-0 transition-opacity duration-300 ${
              transitionIn ? "opacity-100" : "opacity-0"
            } bg-black/40`}
            onClick={() => setOpen(false)}
          />
          <div
            className={`absolute left-0 top-0 h-full transition-transform duration-300 ease-out ${
              transitionIn ? "translate-x-0" : "-translate-x-full"
            } w-80 max-w-[80vw] bg-primary p-4 shadow-xl overflow-y-auto`}
          >
            <div className="flex items-center justify-between mb-4 px-2">
              <span className="text-sm font-semibold text-primary-foreground">Admin Menu</span>
              <button
                onClick={() => setOpen(false)}
                className="text-primary-foreground/70 hover:text-primary-foreground p-1"
              >
                <X size={20} />
              </button>
            </div>
            <ul className="menu w-full gap-2 text-primary-foreground">
              <li className="menu-title text-xs text-primary-foreground/60 px-4">
                Admin
              </li>
              <li>
                <DrawerLink
                  href="/protected/admin"
                  className={`text-sm rounded-lg flex items-center gap-3 px-4 py-2.5 transition-colors ${
                    pathname === "/protected/admin"
                      ? "bg-primary-foreground/15 text-primary-foreground font-medium"
                      : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                  }`}
                >
                  <LayoutDashboard size={18} className="shrink-0" />
                  Dashboard
                </DrawerLink>
              </li>
              <li>
                <DrawerLink
                  href="/protected/admin/flagged-content"
                  className={`text-sm rounded-lg flex items-center gap-3 px-4 py-2.5 transition-colors ${
                    pathname === "/protected/admin/flagged-content"
                      ? "bg-primary-foreground/15 text-primary-foreground font-medium"
                      : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                  }`}
                >
                  <Flag size={18} className="shrink-0" />
                  Flagged Content
                </DrawerLink>
              </li>
              <li>
                <DrawerLink
                  href="/protected/admin/moderation"
                  className={`text-sm rounded-lg flex items-center gap-3 px-4 py-2.5 transition-colors ${
                    pathname === "/protected/admin/moderation"
                      ? "bg-primary-foreground/15 text-primary-foreground font-medium"
                      : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                  }`}
                >
                  <ShieldAlert size={18} className="shrink-0" />
                  Moderation
                </DrawerLink>
              </li>
              <li>
                <DrawerLink
                  href="/protected/admin/appeals"
                  className={`text-sm rounded-lg flex items-center gap-3 px-4 py-2.5 transition-colors ${
                    pathname === "/protected/admin/appeals"
                      ? "bg-primary-foreground/15 text-primary-foreground font-medium"
                      : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                  }`}
                >
                  <MessageCircle size={18} className="shrink-0" />
                  Appeals
                </DrawerLink>
              </li>
              <li className="menu-title text-xs text-primary-foreground/60 mt-4 px-4">
                Routes
              </li>
              <li>
                <DrawerLink
                  href="/protected/add-route"
                  className={`text-sm rounded-lg flex items-center gap-3 px-4 py-2.5 transition-colors ${
                    pathname === "/protected/add-route"
                      ? "bg-primary-foreground/15 text-primary-foreground font-medium"
                      : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                  }`}
                >
                  <PlusCircle size={18} className="shrink-0" />
                  Add Route
                </DrawerLink>
              </li>
              <li>
                <DrawerLink
                  href="/protected/all-routes"
                  className={`text-sm rounded-lg flex items-center gap-3 px-4 py-2.5 transition-colors ${
                    pathname === "/protected/all-routes"
                      ? "bg-primary-foreground/15 text-primary-foreground font-medium"
                      : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                  }`}
                >
                  <Route size={18} className="shrink-0" />
                  All Routes
                </DrawerLink>
              </li>
              <li className="menu-title text-xs text-primary-foreground/60 mt-4 px-4">
                Account
              </li>
              <li>
                <DrawerLink
                  href="/protected/settings"
                  className={`text-sm rounded-lg flex items-center gap-3 px-4 py-2.5 transition-colors ${
                    pathname === "/protected/settings"
                      ? "bg-primary-foreground/15 text-primary-foreground font-medium"
                      : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                  }`}
                >
                  <Settings size={18} className="shrink-0" />
                  Settings &amp; Notifications
                </DrawerLink>
              </li>
              <li className="menu-title text-xs text-primary-foreground/60 mt-4 px-4">
                Community
              </li>
              <li>
                <DrawerLink
                  href="/protected/support"
                  className={`text-sm rounded-lg flex items-center gap-3 px-4 py-2.5 transition-colors ${
                    pathname === "/protected/support"
                      ? "bg-primary-foreground/15 text-primary-foreground font-medium"
                      : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                  }`}
                >
                  <Heart size={18} className="shrink-0" />
                  Support Us
                </DrawerLink>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-primary text-primary-foreground border-t border-primary-foreground/10">
        <div className="flex justify-around items-center h-16 px-2">
          <Link
            href="/protected/admin"
            className="flex flex-col items-center gap-0.5 text-[10px] font-medium"
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/protected/all-routes"
            className="flex flex-col items-center gap-0.5 text-[10px] font-medium"
          >
            <Route size={20} />
            <span>Routes</span>
          </Link>
          <button
            onClick={() => setOpen(true)}
            className="flex flex-col items-center gap-0.5 text-[10px] font-medium"
          >
            <Menu size={20} />
            <span>Menu</span>
          </button>
        </div>
      </nav>
    </>
  );
}
