import NextAuth from "next-auth"
import { authConfig } from "./lib/auth.config"

export const { auth: middleware } = NextAuth(authConfig)

export default middleware((req) => {
  const isLoggedIn = !!req.auth
  const { nextUrl } = req
  
  const isOnDashboard = nextUrl.pathname.startsWith("/dashboard")
  const isOnAuthPage = ["/signin", "/signup"].includes(nextUrl.pathname)

  // 1. If logged out and hitting dashboard, kick to signin
  if (isOnDashboard && !isLoggedIn) {
    return Response.redirect(new URL("/signin", req.url))
  }

  // 2. If logged in and hitting signin/signup, bounce to dashboard
  if (isOnAuthPage && isLoggedIn) {
    return Response.redirect(new URL("/dashboard", req.url))
  }
})

// CRITICAL: Update matcher to explicitly ignore API routes and static chunks
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
