import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { AUTH_PATH } from "@/constants/common";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next(
    {
      request
    }
  );
  const supabase = createServerClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  );

  const PUBLIC_PATHS = new Set<string>(["/", "/login"]);

  function isPublicPath(path: string) {
    if (PUBLIC_PATHS.has(path)) return true;
    if (path.startsWith("/_next") || path === "/favicon.ico" || path.startsWith("/images")) return true;
    return false;
  }

  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname;

  // Redirect unauthenticated users to login, except for auth routes
  if (!user && !path.startsWith("/auth") && !isPublicPath(path)) {
    const url = request.nextUrl.clone();
    url.pathname = AUTH_PATH;
    // url.searchParams.set('next', path);
    return NextResponse.redirect(url);
  }

  // if (
  //   !user &&
  //   !request.nextUrl.pathname.startsWith('/login') &&
  //   !request.nextUrl.pathname.startsWith('/forgot-password') &&
  //   !request.nextUrl.pathname.startsWith('/reset-password') &&
  //   !request.nextUrl.pathname.startsWith('/signup') &&
  //   !request.nextUrl.pathname.startsWith('/auth')
  // ) {
  //   // No user, potentially respond by directing the user to the login page
  //   const url = request.nextUrl.clone()
  //   url.pathname = '/login'
  //   return NextResponse.redirect(url)
  // }// IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!


  // Preventing authenticated users from accessing the login page
  // if (user && path.startsWith(AUTH_PATH)) {
  //   const url = request.nextUrl.clone();
  //   url.pathname = '/';
  //   return NextResponse.redirect(url);
  // }
  return supabaseResponse;
}