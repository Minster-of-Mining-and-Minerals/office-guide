import { NextRequest, NextResponse } from "next/server";

/**
 * Cookie-check middleware modelled after CMS. Cheap: no `auth()` call
 * (which would spin up the auth machinery on every request) — we only
 * look for the presence of a NextAuth session-token cookie. If it's
 * missing on a protected path, we redirect to `/login?callbackUrl=…`.
 *
 * ALSO: every protected-route response gets `Cache-Control: no-store`
 * so the browser doesn't stash it in the back-forward cache (bfcache).
 * Without that header, hitting the browser's Back button after logout
 * restores the previous page from memory without re-running the
 * middleware, letting an unauthenticated user see cached admin
 * screens. `no-store` forces a network fetch on every navigation,
 * which then hits the cookie check below.
 *
 * Real session validation still runs on the pages themselves (via
 * `useSession()` in the private layout) and on API calls (via
 * `baseApi`'s 401 auto-logout). Middleware is only about making the
 * initial "hit a private URL when logged out" case land on login.
 */

// Routes anyone can hit without a session. Keep this list tight so we
// don't accidentally expose admin surfaces.
const PUBLIC_PATHS = new Set<string>([
  "/",
  "/login",
  "/forgot-password",
]);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/floor/")) return true;
  return false;
}

function hasSessionCookie(req: NextRequest): boolean {
  for (const cookie of req.cookies.getAll()) {
    // Auth.js v5 chunk-splits large session cookies, so the name may
    // be suffixed (e.g. `authjs.session-token.0`). Prefix match covers
    // every variant across cookie names Auth.js has shipped with.
    if (
      cookie.name.startsWith("next-auth.session-token") ||
      cookie.name.startsWith("__Secure-next-auth.session-token") ||
      cookie.name.startsWith("authjs.session-token") ||
      cookie.name.startsWith("__Secure-authjs.session-token")
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Set the cache-busting headers that keep private pages out of the
 * browser's bfcache. Applied to every private-route response, whether
 * we let it through or redirected to /login.
 */
function withNoStore(res: NextResponse): NextResponse {
  res.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  return res;
}

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const hasSession = hasSessionCookie(req);
  const isPublic = isPublicPath(pathname);
  const isLogin = pathname === "/login";

  // Already signed in and visiting the login page → send to dashboard.
  // Also flag as no-store so a subsequent logout + back doesn't restore
  // this response and skip the middleware.
  if (isLogin && hasSession) {
    return withNoStore(
      NextResponse.redirect(new URL("/dashboard", req.url))
    );
  }

  // Unauthenticated hit on a protected route → login with callbackUrl.
  if (!isPublic && !hasSession) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname + req.nextUrl.search);
    return withNoStore(NextResponse.redirect(loginUrl));
  }

  // Authenticated private-route request: pass through but attach the
  // no-store headers so the browser refetches on Back navigation.
  if (!isPublic) {
    return withNoStore(NextResponse.next());
  }

  // Truly public — let the browser cache normally.
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals, static assets, favicons, and the
    // NextAuth API itself (it needs to be reachable to check the
    // session cookie).
    "/((?!api/auth|_next/static|_next/image|favicon.ico|favicon_io|.*\\..*).*)",
  ],
};
