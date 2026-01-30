import { type NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

async function updateSession(request: NextRequest) {
  // 1. Environment Variable Check
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    console.error("Missing Supabase Environment Variables");
    // Return a generic error response or redirect to a maintenance page if needed
    // For now, redirect to login to avoid 500 crash
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );

            response = NextResponse.next({
              request,
            });

            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    // 2. Auth User Check
    const { error } = await supabase.auth.getUser();

    if (error) {
      // If auth fails (e.g. invalid token), we might want to clear invalid cookies
      // But often, just continuing is fine as the app will redirect to login on protected pages.
      // However, if the error is "Base64" or severe, manual cleanup helps.
      // Here we rely on supabase.auth.getUser() to handle standard token issues.
      if (
        error.message.includes("base64") ||
        error.message.includes("malformed")
      ) {
        console.warn("Malformed cookie detected, clearing sessions.");
        const allCookies = request.cookies.getAll();
        allCookies.forEach((cookie) => {
          if (cookie.name.startsWith("sb-")) {
            response.cookies.delete(cookie.name);
          }
        });
      }
    }

    return response;
  } catch (e) {
    // 3. Global Error Handler
    // If ANYTHING crashes (cookie parsing, excessive recursion, etc), catch it here.
    console.error("Critical Error in proxy.ts:", e);

    // Safely redirect to login instead of 500 page
    // Ensure we don't create an infinite redirect loop if we are already on /login
    if (request.nextUrl.pathname.startsWith("/login")) {
      return NextResponse.next();
    }

    const response = NextResponse.redirect(new URL("/login", request.url));

    // Attempt to clear potential bad cookies causing the crash
    try {
      const allCookies = request.cookies.getAll();
      allCookies.forEach((cookie) => {
        if (cookie.name.startsWith("sb-")) {
          response.cookies.delete(cookie.name);
        }
      });
    } catch (cookieError) {
      console.error("Failed to clear cookies in error handler:", cookieError);
    }

    return response;
  }
}

export async function proxy(request: NextRequest) {
  // Debug log to confirm proxy is running

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
