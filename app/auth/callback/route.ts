import { createClient } from "@/lib/supabase/client";
import { type NextRequest, NextResponse } from "next/server";
// Note: We need a server-side client for cookie handling in a real app,
// but for this client-side demo we are using the browser client or handling code exchange via SSR if we had Server Actions.
// However, @supabase/ssr needs cookies set on the server for full Auth support.

// Since we haven't set up the full server-side client utility yet (cookie methods),
// Let's create a basic route handler that at least redirects correctly.
// Ideally, we should implement a createServerClient in lib/supabase/server.ts for this.

// For now, let's implement the standard PKCE exchange assuming we add the server utils.
// But first, let's just make sure the directory exists and add a basic handler.

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const cookieStore = await cookies();

    // Create a mutable container for cookies to ensure we catch them all
    const cookiesToSetLater: {
      name: string;
      value: string;
      options: CookieOptions;
    }[] = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            // 1. Set in Next.js cookie store (for good measure)
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options),
              );
            } catch {}

            // 2. Capture to set on response manually
            cookiesToSet.forEach((c) => cookiesToSetLater.push(c));
          },
        },
        cookieOptions: {
          secure: process.env.NODE_ENV === "production",
        },
      },
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.session) {
      const response = NextResponse.redirect(`${origin}${next}`);

      // Explicitly set the captured cookies on the response

      // FALLBACK: If Supabase didn't populate cookiesToSetLater, manually backup the session.
      if (cookiesToSetLater.length === 0 && data.session) {
        let projectRef = "project-ref";
        try {
          const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);
          projectRef = url.hostname.split(".")[0];
        } catch {
          console.error("Failed to parse Supabase URL for cookie generation");
        }

        const cookieName = `sb-${projectRef}-auth-token`;
        // Store standard JSON string.
        // Note: Supabase SSR client handles standard JSON cookies.
        const cookieValue = JSON.stringify(data.session);

        cookiesToSetLater.push({
          name: cookieName,
          value: cookieValue,
          options: {
            path: "/",
            maxAge: data.session.expires_in,
            httpOnly: false,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
          },
        });
      }
      cookiesToSetLater.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, {
          ...options,
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
        });
      });

      return response;
    } else {
      const errorMessage = error?.message || "Unknown error occurred";
      console.error(
        "Auth Code Exchange Error:",
        error || "No session data returned",
      );
      return NextResponse.redirect(
        `${origin}/auth/auth-code-error?error=${encodeURIComponent(errorMessage)}`,
      );
    }
  }

  // Error case
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
