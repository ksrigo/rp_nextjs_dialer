// middleware.js
import { NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  console.log("pathname", pathname);
  // Bypass middleware for public paths and static assets
  // if (
  //   pathname.startsWith("/api") ||
  //   pathname.startsWith("/assets") || // Exclude assets directory
  //   pathname.startsWith("/static") || // Exclude static directory
  //   pathname.startsWith("/public")    // Exclude public directory
  // ) {
  //   return NextResponse.next();
  // }

  const accessToken = request.cookies.get("at")?.value;
  const refreshToken = request.cookies.get("rt")?.value;

  // If the request is for /login:
  if (pathname === "/login" || pathname === "/forgot-password") {
    // If a valid access token exists, redirect the user to the protected page.
    if (accessToken && refreshToken) {
      let payload;
      try {
        payload = jwtDecode(accessToken);
      } catch (error) {
        console.log("Token decode failed:", error);
        // Let the login page render if token cannot be decoded.
        return NextResponse.next();
      }
      // If the token is not expired, send the user to /dashboard (or another protected page).
      if (payload.exp * 1000 > Date.now()) {
        return NextResponse.redirect(new URL("/", request.url));
      }
      // If token is expired, let the login page render so that your refresh logic (or re-login) can handle it.
      return NextResponse.next();
    }
    // No access token, so let them see the login page.
    return NextResponse.next();
  }

  if (!accessToken || !refreshToken && pathname === "/forgot-password" ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  let payload;
  try {
    // Decode the token without verifying the signature.
    payload = jwtDecode(accessToken);
  } catch (error) {
    console.log("Token decode failed:", error);
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Check expiration (exp is usually in seconds)
  if (payload.exp * 1000 < Date.now()) {
    console.log("Token expired");
    // Token expired, try to refresh.
    // const refreshToken = request.cookies.get("rt")?.value;
    // console.log("refreshToken", refreshToken);
    // if (!refreshToken) {
    //   return NextResponse.redirect(new URL("/login", request.url));
    // }
    const apiUrl = process.env.API_URL + "/refresh";
    console.log("apiUrl", apiUrl);

    const refreshResponse = await fetch(new URL(apiUrl, request.url), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token:refreshToken }),
    });
    
    if (!refreshResponse.ok) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const data = await refreshResponse.json();
    console.log("middleware data", data);
    // const { access_token } = data;
    const response = NextResponse.next();

    response.cookies.set("at", data.access_token, {
      httpOnly: true,
      path: "/",
    });
    response.cookies.set("rt", data.refresh_token, {
      httpOnly: true,
      path: "/",
    });

    return response;
  } 

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|static|assets|public).*)"],
};
 