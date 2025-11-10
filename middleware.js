import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  console.log("pathname", pathname);

  // Allow static assets (API routes are excluded by matcher)
  if (
    pathname.startsWith("/api/auth") ||
    pathname === "/login" ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/images")
  ) {
    return NextResponse.next();
  }

  // Use NextAuth JWT to detect authenticated user
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
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

  // Protect all other routes - require at least a token (allow expired to reach server to refresh)
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If token has an error (e.g., refresh failed), clear session cookies and send to login
  if (token?.error) {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete('next-auth.session-token');
    res.cookies.delete('__Secure-next-auth.session-token');
    res.cookies.delete('next-auth.csrf-token');
    res.cookies.delete('next-auth.callback-url');
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|static|assets|public).*)"],
};
