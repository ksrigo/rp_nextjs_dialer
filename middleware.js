import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  console.log("pathname", pathname);

  // Allow static assets (API routes are excluded by matcher)
  if (
    pathname.startsWith("/assets") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  // Use NextAuth JWT to detect authenticated user
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
  const now = Math.floor(Date.now() / 1000);
  const isExpired = typeof token?.accessTokenExpires === "number" && token.accessTokenExpires <= now;
  const hasValidToken = !!token && !token?.error && !isExpired;

  // Auth pages handling: redirect authenticated users away from auth pages
  if (pathname === "/login" || pathname === "/forgot-password") {
    // Only redirect away if token is valid; otherwise allow the auth page
    if (hasValidToken) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Protect all other routes - require a valid token
  if (!hasValidToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|static|assets|public).*)"],
};
