import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

// Create the NextAuth handler
const handler = NextAuth(authOptions)

// Export for both GET and POST requests
// GET = check session, POST = login/logout
export { handler as GET, handler as POST }
