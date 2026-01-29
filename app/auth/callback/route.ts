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
    const cookiesToSetLater: { name: string; value: string; options: CookieOptions }[] = [];

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
                cookieStore.set(name, value, options)
              );
            } catch {}
            
            // 2. Capture to set on response manually
            cookiesToSet.forEach((c) => cookiesToSetLater.push(c));
          },
        },
        cookieOptions: {
          secure: process.env.NODE_ENV === "production",
        },
      }
    );
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.session) {
      const response = NextResponse.redirect(`${origin}${next}`);
      
      // Explicitly set the captured cookies on the response

      
      // FALLBACK: If Supabase didn't populate cookiesToSetLater (which happens sometimes with exchangeCode),
      // we manually backup the session into a cookie.
      if (cookiesToSetLater.length === 0 && data.session) {

          let projectRef = "project-ref";
          try {
             const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);
             projectRef = url.hostname.split('.')[0];
          } catch {
             console.error("Failed to parse Supabase URL for cookie generation");
          }
          
          const cookieName = `sb-${projectRef}-auth-token`;
          
          // Use Buffer to handle UTF-8 characters (Korean nicknames) correctly. btoa fails with non-Latin1.
          const sessionString = JSON.stringify(data.session);
          const base64Session = Buffer.from(sessionString).toString('base64');
          const cookieValue = `base64-${base64Session}`;
          cookiesToSetLater.push({
              name: cookieName,
              value: cookieValue,
              options: {
                  path: '/',
                  maxAge: data.session.expires_in,
                  httpOnly: false,
                  secure: process.env.NODE_ENV === 'production',
                  sameSite: 'lax',
              }
          });
      }

      cookiesToSetLater.forEach(({ name, value, options }) => {
        // Simple manual chunking if value is too large
        // Note: This is a basic implementation. Ideally Supabase's createServerClient handles this if using setAll correctly,
        // but since we are copying manually, we might need to respect size limits.
        // However, usually the VALUE itself is already chunked by Supabase if it's too big.
        // If Supabase gave us one giant cookie, we must split it.
        
        const CHUNK_SIZE = 3000;
        if (value.length > CHUNK_SIZE) {

            const chunks = Math.ceil(value.length / CHUNK_SIZE);
            for (let i = 0; i < chunks; i++) {
                const chunkName = `${name}.${i}`;
                const chunkValue = value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
                response.cookies.set(chunkName, chunkValue, {
                   ...options,
                    httpOnly: false, 
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    path: '/',
                });
            }
        } else {
             response.cookies.set(name, value, {
                ...options,
                 httpOnly: false, 
                 secure: process.env.NODE_ENV === 'production',
                 sameSite: 'lax',
                 path: '/',
             });
        }
      });

      return response;
    } else {
        const errorMessage = error?.message || "Unknown error occurred";
        console.error("Auth Code Exchange Error:", error || "No session data returned");
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(errorMessage)}`);
    }
  }

  // Error case
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
