"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User, Settings, LogOut, Heart } from "lucide-react";

export default function UserDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

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
        <div className="absolute right-0 top-10 w-48 rounded-xl border border-border bg-card shadow-xl z-50 py-1.5">
          <Link
            href="/protected"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
          >
            <User size={15} className="text-muted-foreground" />
            Account
          </Link>
          <Link
            href="/protected"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
          >
            <Settings size={15} className="text-muted-foreground" />
            Settings
          </Link>
          <hr className="border-border my-1" />
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-destructive hover:bg-muted transition-colors"
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
