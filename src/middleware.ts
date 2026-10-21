import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

const PUBLIC_PATHS = [
  "/",
  "/pricing",
  "/login",
  "/signup",
  "/callback",
  "/privacy",
  "/terms",
  "/data-deletion",
  "/docs",
];

function isPublicRoute(path: string): boolean {
  if (PUBLIC_PATHS.includes(path)) return true;
  if (path.startsWith("/api/webhooks")) return true;
  if (path.startsWith("/api/meta/data-deletion")) return true;
  if (path.startsWith("/api/instagram/callback")) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const path = request.nextUrl.pathname;
  const isPublic = isPublicRoute(path);

  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'unsafe-eval'`,
    `style-src 'self' 'unsafe-inline'`,
    "img-src 'self' blob: data: https://*.cdninstagram.com https://*.fbcdn.net",
    `connect-src 'self' ${supabaseUrl ?? ""} https://*.supabase.co wss://*.supabase.co https://*.sentry.io`,
    "font-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self' https://www.instagram.com https://www.facebook.com",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ];

  const csp = cspDirectives.join("; ");

  if (!supabaseUrl || !supabaseAnonKey) {
    if (isPublic) {
      const res = NextResponse.next();
      res.headers.set("Content-Security-Policy", csp);
      return res;
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  let response = NextResponse.next({ request });

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && !isPublic) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    if (user && (path === "/login" || path === "/signup")) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  } catch {
    if (!isPublic) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  response.headers.set("Content-Security-Policy", csp);

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
