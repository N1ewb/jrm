"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { User, Settings, LogOut, Heart, Award, Info } from "lucide-react";

export default function UserDropdown() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    async function fetchUser() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.email) setEmail(user.email);
      } catch {}
    }
    fetchUser();
  }, []);

  const handleLogout = async () => {
    const { signOutAction } = await import("@/actions/user.actions");
    await signOutAction();
  };

  const displayName = email ? email.split("@")[0] : "User";
  const truncatedName =
    displayName.length > 14
      ? displayName.slice(0, 12) + "…"
      : displayName;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center hover:bg-primary-foreground/30 transition-colors"
        aria-label="User menu"
      >
        <User size={16} className="text-white" />
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-56 rounded-xl border border-border bg-card shadow-xl z-50 py-1.5">
          {/* User header */}
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User size={16} className="text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {truncatedName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5 group relative">
                  <Award size={12} className="text-muted-foreground/40" />
                  <span className="text-[11px] text-muted-foreground/60">
                    No badge yet
                  </span>
                  <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50">
                    <div className="bg-foreground text-background text-[11px] px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                      Contribute routes and help the
                      <br />
                      community to earn your first badge
                      <div className="absolute top-full left-4 w-2 h-2 bg-foreground rotate-45 -mt-1" />
                    </div>
                  </div>
                  <Info size={10} className="text-muted-foreground/30 shrink-0" />
                </div>
              </div>
            </div>
          </div>

          <div className="py-1">
            <Link
              href="/protected/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <Settings size={15} className="text-muted-foreground" />
              Settings
            </Link>
            <Link
              href="/protected/support"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <Heart size={15} className="text-muted-foreground" />
              Support Us
            </Link>
          </div>
          <hr className="border-border" />
          <div className="py-1">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-destructive hover:bg-muted transition-colors"
            >
              <LogOut size={15} />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
