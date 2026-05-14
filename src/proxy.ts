import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const STUDENT_ROUTES = [
  "/dashboard",
  "/my-courses",
  "/learn",
  "/quiz",
  "/certificates",
  "/orders",
  "/wishlist",
  "/settings",
];

const INSTRUCTOR_ROUTES = ["/instructor"];
const ADMIN_ROUTES = ["/admin"];
const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/verify-email"];

function matchesRoutes(pathname: string, routes: string[]): boolean {
  return routes.some((r) => pathname.startsWith(r));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Fast cookie check — no DB call in proxy
  const sessionCookie = getSessionCookie(request);
  const isAuthenticated = !!sessionCookie;

  const isProtectedRoute =
    matchesRoutes(pathname, STUDENT_ROUTES) ||
    matchesRoutes(pathname, INSTRUCTOR_ROUTES) ||
    matchesRoutes(pathname, ADMIN_ROUTES);

  const isAuthRoute = matchesRoutes(pathname, AUTH_ROUTES);

  if (!isAuthenticated && isProtectedRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Role-based access is enforced inside each route's layout.tsx
  // using a server-side session fetch — not here — to avoid DB calls on every request.

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals, static files, and API routes
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
