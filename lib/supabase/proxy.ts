import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  if (!hasEnvVars) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const pathname = request.nextUrl.pathname;
  const isPublicPath = pathname === "/" || pathname.startsWith("/auth");

  // No session – only allow public paths
  if (!user) {
    if (!isPublicPath) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Has session – get role
  let role = "user";
  try {
    const userId = user.sub;
    if (userId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();
      role = profile?.role ?? "user";
    }
  } catch {}

  // Expose role to layouts via request cookie (no httpOnly)
  request.cookies.set("user-role", role);
  supabaseResponse.cookies.set("user-role", role, {
    path: "/",
    sameSite: "lax",
  });

  // On landing/auth page – push to designated route
  if (isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = `/protected/${role}`;
    return NextResponse.redirect(url);
  }

  // On protected route – always redirect root to role route, and verify role matches
  if (pathname === "/protected" || pathname.startsWith("/protected/")) {
    // Root /protected → redirect to role-specific route
    if (pathname === "/protected") {
      const url = request.nextUrl.clone();
      url.pathname = `/protected/${role}`;
      return NextResponse.redirect(url);
    }

    const isAdminRoute = pathname.startsWith("/protected/admin");
    const isUserRoute = pathname.startsWith("/protected/user");

    if (isAdminRoute && role !== "admin" && role !== "gov_official") {
      const url = request.nextUrl.clone();
      url.pathname = `/protected/${role}`;
      return NextResponse.redirect(url);
    }

    if (isUserRoute && role !== "user") {
      const url = request.nextUrl.clone();
      url.pathname = `/protected/${role}`;
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
