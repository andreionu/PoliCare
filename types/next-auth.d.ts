import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      doctorId: string | null
      patientId: string | null
    } & DefaultSession["user"]
  }

  interface User {
    role: string
    doctorId?: string | null
    patientId?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    id: string
    doctorId?: string | null
    patientId?: string | null
  }
}
