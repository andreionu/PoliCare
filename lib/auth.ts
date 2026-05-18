import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"

export const authOptions: NextAuthOptions = {
  // Where to redirect after login/logout
  pages: {
    signIn: "/login", // Custom login page (we'll update your existing one)
  },

  // How long sessions last
  session: {
    strategy: "jwt", // Use JSON Web Tokens (stored in cookies)
    maxAge: 24 * 60 * 60, // 24 hours
  },

  // Authentication providers (we use email/password)
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      // This function runs when someone tries to log in
      async authorize(credentials) {
        // 1. Check if email and password were provided
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email și parola sunt obligatorii")
        }

        // 2. Find the user in the database
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            doctorProfile: { select: { id: true } },
            patientProfile: { select: { id: true } },
          },
        })

        // 3. If no user found, reject
        if (!user) {
          throw new Error("Email sau parolă incorectă")
        }

        // 4. Check if user is active
        if (user.status !== "ACTIVE") {
          throw new Error("Contul este dezactivat")
        }

        // 5. Compare the password with the hashed version
        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!passwordMatch) {
          throw new Error("Email sau parolă incorectă")
        }

        // 6. Success! Return the user data
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          doctorId: user.doctorProfile?.id ?? null,
          patientId: user.patientProfile?.id ?? null,
        }
      },
    }),
  ],

  // Callbacks let us customize the JWT and session
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
        token.doctorId = (user as any).doctorId ?? null
        token.patientId = (user as any).patientId ?? null
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.id = token.id as string
        session.user.doctorId = (token.doctorId as string | null) ?? null
        session.user.patientId = (token.patientId as string | null) ?? null
      }
      return session
    },
  },
}
