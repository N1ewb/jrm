"use client";

import Link from "next/link";

export function DrawerLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        const el = document.getElementById(
          "protected-drawer",
        ) as HTMLInputElement | null;
        if (el) el.checked = false;
      }}
    >
      {children}
    </Link>
  );
}
