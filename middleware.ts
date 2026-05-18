import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import type { NextRequest } from "next/server"

const ADMIN_ROLES = ["SUPER_ADMIN", "FRONT_DESK"]

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
]

function redirectByRole(role: string, request: NextRequest) {
  if (ADMIN_ROLES.includes(role)) return NextResponse.redirect(new URL("/admin", request.url))
  if (role === "DOCTOR") return NextResponse.redirect(new URL("/doctor/dashboard", request.url))
  if (role === "PATIENT") return NextResponse.redirect(new URL("/patient/dashboard", request.url))
  return NextResponse.redirect(new URL("/login", request.url))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

  // Redirect already-authenticated users away from login
  if (pathname === "/login") {
    if (token) return redirectByRole(token.role as string, request)
    return NextResponse.next()
  }

  // Admin paths — require SUPER_ADMIN or FRONT_DESK
  const isAdminPath = ADMIN_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  )
  if (isAdminPath) {
    if (!token) return NextResponse.redirect(new URL("/login", request.url))
    if (!ADMIN_ROLES.includes(token.role as string))
      return NextResponse.redirect(new URL("/login", request.url))
    return NextResponse.next()
  }

  // Doctor portal
  if (pathname.startsWith("/doctor")) {
    if (!token) return NextResponse.redirect(new URL("/login", request.url))
    if (token.role !== "DOCTOR") return NextResponse.redirect(new URL("/login", request.url))
    return NextResponse.next()
  }

  // Patient portal
  if (pathname.startsWith("/patient")) {
    if (!token) return NextResponse.redirect(new URL("/login", request.url))
    if (token.role !== "PATIENT") return NextResponse.redirect(new URL("/login", request.url))
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
    "/doctor/:path*",
    "/patient/:path*",
    "/login",
  ],
}
