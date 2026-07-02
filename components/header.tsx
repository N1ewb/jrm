import { Suspense } from "react";
import Link from "next/link";
import { DeployButton } from "@/components/deploy-button";
import { AuthButton } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { hasEnvVars } from "@/lib/utils";
import { MobileMenu } from "@/components/mobile-menu";

export function Header() {
  const authSection = !hasEnvVars ? (
    <EnvVarWarning />
  ) : (
    <Suspense fallback={<div className="h-8 w-20 animate-pulse rounded bg-muted" />}>
      <AuthButton />
    </Suspense>
  );

  return (
    <header className="w-full border-b border-b-foreground/10">
      <div className="max-w-5xl mx-auto flex items-center justify-between h-16 px-5">
        <Link href="/" className="font-semibold text-sm whitespace-nowrap">
          Next.js Supabase Starter
        </Link>

        <nav className="hidden md:flex items-center gap-4">
          <DeployButton />
          {authSection}
        </nav>

        <div className="flex md:hidden">
          <MobileMenu>
            <DeployButton />
            {authSection}
          </MobileMenu>
        </div>
      </div>
    </header>
  );
}
