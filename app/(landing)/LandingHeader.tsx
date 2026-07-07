"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import JeepWhite from "../assets/jeep-icon-small-white.png";

function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [transitionIn, setTransitionIn] = useState(false);

  useEffect(() => {
    if (menuOpen) {
      setMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setTransitionIn(true));
      });
    } else {
      setTransitionIn(false);
      const timer = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [menuOpen]);

  function close() {
    setMenuOpen(false);
  }

  return (
    <>
      <div className="flex items-center gap-2 text-white flex-1">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src={JeepWhite}
            alt="JRM"
            width={28}
            height={28}
            className="rounded shrink-0"
          />
          <span className="font-bold text-sm">JRM</span>
        </Link>
        <div className="flex-1" />
        <div className="hidden lg:flex items-center gap-1">
          <Link
            href="/auth/login"
            className="btn btn-ghost text-white text-sm btn-sm"
          >
            Sign In
          </Link>
          <Link
            href="/auth/sign-up"
            className="btn text-sm btn-sm bg-white text-[#250057] hover:bg-white/90 border-none"
          >
            Get Started
          </Link>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setMenuOpen(true)}
        className="flex lg:hidden p-2 text-white"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      {mounted && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className={`absolute inset-0 transition-opacity duration-300 ${
              transitionIn ? "opacity-100" : "opacity-0"
            } bg-black/40`}
            onClick={close}
          />
          <div
            className={`relative w-80 max-w-[80vw] bg-[#250057] h-full p-6 shadow-xl transition-transform duration-300 ease-out ${
              transitionIn ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <button
              type="button"
              onClick={close}
              className="text-white/60 hover:text-white mb-6"
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/auth/login"
                  onClick={close}
                  className="block px-4 py-2.5 rounded-lg text-white hover:bg-white/10 transition-colors"
                >
                  Sign In
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/sign-up"
                  onClick={close}
                  className="block px-4 py-2.5 rounded-lg text-white hover:bg-white/10 transition-colors"
                >
                  Get Started
                </Link>
              </li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

export default LandingHeader;
