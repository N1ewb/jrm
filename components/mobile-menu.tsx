"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

export function MobileMenu({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className="p-2"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      {isOpen && (
        <div className="fixed inset-x-0 top-16 bg-background border-b border-b-foreground/10 px-5 py-4 z-50 shadow-lg">
          <div className="max-w-5xl mx-auto flex flex-col gap-3">
            {children}
          </div>
        </div>
      )}
    </>
  );
}
