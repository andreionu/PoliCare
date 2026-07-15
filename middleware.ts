import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import type { NextRequest } from "next/server"

const ADMIN_ROLES = ["SUPER_ADMIN", "FRONT_DESK"]
const MARKETING_PATHS = ["/reports", "/activity", "/billing"]

const ADMIN_PATHS = [
  "/admin",
  "/doctors",
  "/patients",
  "/appointments",
  "/users",
  "/departments",
  "/services",
  "/reports",
  "/settings",
  "/activity",
  "/billing",
]

function redirectByRole(role: string, request: NextRequest) {
  if (ADMIN_ROLES.includes(role)) return NextResponse.redirect(new URL("/admin", request.url))
  if (role === "MARKETING") return NextResponse.redirect(new URL("/reports", request.url))
  if (role === "DOCTOR") return NextResponse.redirect(new URL("/doctor/dashboard", request.url))
  if (role === "PATIENT") return NextResponse.redirect(new URL("/patient/dashboard", request.url))
  return NextResponse.redirect(new URL("/login", request.url))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

  // Force logout if session was invalidated (password changed after token was issued)
  if (token?.invalid) {
    const response = NextResponse.redirect(new URL("/login", request.url))
    response.cookies.delete("next-auth.session-token")
    response.cookies.delete("__Secure-next-auth.session-token")
    return response
  }

  // Redirect already-authenticated users away from login
  if (pathname === "/login") {
    if (token) return redirectByRole(token.role as string, request)
    return NextResponse.next()
  }

  // Admin paths — require SUPER_ADMIN, FRONT_DESK, or MARKETING (restricted)
  const isAdminPath = ADMIN_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  )
  if (isAdminPath) {
    if (!token) return NextResponse.redirect(new URL("/login", request.url))
    const role = token.role as string
    if (ADMIN_ROLES.includes(role)) return NextResponse.next()
    if (role === "MARKETING") {
      const allowed = MARKETING_PATHS.some(p => pathname === p || pathname.startsWith(p + "/"))
      return allowed ? NextResponse.next() : NextResponse.redirect(new URL("/reports", request.url))
    }
    return redirectByRole(role, request)
  }

  // Doctor portal
  if (pathname.startsWith("/doctor")) {
    if (!token) return NextResponse.redirect(new URL("/login", request.url))
    if (token.role !== "DOCTOR") return redirectByRole(token.role as string, request)
    return NextResponse.next()
  }

  // Patient portal
  if (pathname.startsWith("/patient")) {
    if (!token) return NextResponse.redirect(new URL("/login", request.url))
    if (token.role !== "PATIENT") return redirectByRole(token.role as string, request)
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/admin",
    "/doctors/:path*",
    "/doctors",
    "/patients/:path*",
    "/patients",
    "/appointments/:path*",
    "/appointments",
    "/users/:path*",
    "/users",
    "/departments/:path*",
    "/departments",
    "/services/:path*",
    "/services",
    "/reports/:path*",
    "/reports",
    "/settings/:path*",
    "/settings",
    "/activity/:path*",
    "/activity",
    "/billing/:path*",
    "/billing",
    "/doctor/:path*",
    "/patient/:path*",
    "/login",
  ],
}
