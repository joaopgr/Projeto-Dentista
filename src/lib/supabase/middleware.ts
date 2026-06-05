import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  CLIENT_SESSION_COOKIE,
  verifyClientSessionPatientId,
} from "@/lib/client-session";

type CookieToSet = {
  name: string;
  value: string;
  options?: CookieOptions;
};

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthPage = pathname.startsWith("/login");
  const isPortal = pathname.startsWith("/portal");
  const isClientApi = pathname.startsWith("/api/client");
  const isPublicConfirm = pathname.startsWith("/c/");
  const isHome = pathname === "/";

  const clientToken = request.cookies.get(CLIENT_SESSION_COOKIE)?.value;
  const clientPatientId = clientToken
    ? await verifyClientSessionPatientId(clientToken)
    : null;

  if (user && clientPatientId) {
    supabaseResponse.cookies.delete(CLIENT_SESSION_COOKIE);
  }

  const effectiveClientId = user ? null : clientPatientId;

  if (effectiveClientId && (isAuthPage || isHome)) {
    const url = request.nextUrl.clone();
    url.pathname = "/portal";
    return NextResponse.redirect(url);
  }

  if (user && isPortal) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (effectiveClientId && !isPortal && !isClientApi && !isAuthPage && !isHome) {
    const url = request.nextUrl.clone();
    url.pathname = "/portal";
    return NextResponse.redirect(url);
  }

  if (isPortal && !effectiveClientId) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (!user && !effectiveClientId && !isAuthPage && !isHome && !isClientApi && !isPublicConfirm) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && (isAuthPage || isHome)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
