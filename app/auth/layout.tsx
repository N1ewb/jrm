import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LandingHeader from "../(landing)/LandingHeader";

async function SessionGuard({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const role = profile?.role ?? "user";

    if (role === "admin" || role === "gov_official") {
      redirect("/protected/admin");
    } else if (role === "user") {
      redirect("/protected/user");
    }
  }

  return <>{children}</>;
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <div className="bg-[#250057] px-5 py-2">
        <div className="max-w-6xl mx-auto">
          <LandingHeader />
        </div>
      </div>
      <main className="flex-1 flex items-center justify-center">
        <Suspense fallback={children}>
          <SessionGuard>{children}</SessionGuard>
        </Suspense>
      </main>
    </div>
  );
}
