"use client";

import { useState } from "react";
import Link from "next/link";
import LandingHeader from "./LandingHeader";
import { X } from "lucide-react";

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-dvh">
      <div className="bg-[#250057] w-full">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-2">
          <LandingHeader />
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex lg:hidden p-2 text-white"
            aria-label="Open menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="inline-block h-6 w-6 stroke-current"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMenuOpen(false)}
          />
          <div className="relative w-80 max-w-[80vw] bg-[#250057] h-full p-6 shadow-xl">
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="text-white/60 hover:text-white mb-6"
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/auth/login"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 rounded-lg text-white hover:bg-white/10 transition-colors"
                >
                  Sign In
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/sign-up"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 rounded-lg text-white hover:bg-white/10 transition-colors"
                >
                  Get Started
                </Link>
              </li>
            </ul>
          </div>
        </div>
      )}

      <div className="flex flex-col flex-1">{children}</div>
    </div>
  );
}
