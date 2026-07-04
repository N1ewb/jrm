import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { EnvVarWarning } from "@/components/env-var-warning";
import { hasEnvVars } from "@/lib/utils";
import UserDropdown from "@/components/user-dropdown";
import JeepWhite from "@/app/assets/jeep-icon-small-white.png";

export function Header() {
  const authSection = !hasEnvVars ? (
    <EnvVarWarning />
  ) : (
    <Suspense
      fallback={<div className="h-8 w-8 rounded-full bg-primary-foreground/20 animate-pulse" />}
    >
      <UserDropdown />
    </Suspense>
  );

  return (
    <>
      <div className="navbar bg-[#250057] w-full">
        <div className="flex-none lg:hidden">
          <label
            htmlFor="protected-drawer"
            aria-label="open sidebar"
            className="btn btn-square btn-ghost drawer-button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="inline-block h-6 w-6 stroke-current text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </label>
        </div>
        <div className="flex items-center gap-2 px-2 text-white">
          <Image
            src={JeepWhite}
            alt="JRM"
            width={28}
            height={28}
            className="rounded"
          />
          <Link href="/" className="font-bold text-sm">
            JRM
          </Link>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">{authSection}</div>
      </div>
    </>
  );
}
