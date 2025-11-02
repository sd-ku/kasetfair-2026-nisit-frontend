import NextAuth, { type NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const API_URL = process.env.API_URL || "http://localhost:8000"

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async jwt({ token, account }) {
      if (account?.id_token) {
        try {
          const res = await fetch(`${API_URL}/auth/exchange`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id_token: (account as any).id_token,
            }),
            cache: "no-store",
          })

          const text = await res.text()
          let data: any = {}
          try { data = text ? JSON.parse(text) : {} } catch { /* ignore malformed JSON */ }

          if (!res.ok) {
            console.error("exchange error:", res.status, text)
            return token
          }

          const accessToken = typeof data?.accessToken === "string" ? data.accessToken : null
          const profileComplete =
            typeof data?.profileComplete === "boolean" ? data.profileComplete : null
          const missing = Array.isArray(data?.missing) ? data.missing : null
          const email = data?.email ?? token.email ?? account?.email ?? null

          ;(token as any).appAccessToken = accessToken
          ;(token as any).profileComplete = profileComplete
          ;(token as any).missing = missing
          ;(token as any).email = email

          if (data?.user && typeof data.user === "object") {
            ;(token as any).user = data.user
          }

          if (typeof data?.role === "string") {
            ;(token as any).role = data.role
          }

          return token
        } catch (error) {
          console.error("auth/exchange failed:", error)
        }
      }

      return token
    },

    async session({ session, token }) {
      session.accessToken = (token as any).appAccessToken ?? null
      session.profileComplete =
        (token as any).profileComplete !== undefined ? (token as any).profileComplete : null
      session.missing = ((token as any).missing as string[] | null) ?? null
      session.email = (token as any).email ?? session.user?.email ?? null

      if (session.user && (token as any).user && typeof (token as any).user === "object") {
        session.user = { ...session.user, ...(token as any).user }
      }

      if ((token as any).role && session.user) {
        ;(session.user as any).role = (token as any).role
      }

      return session
    },
  },

  debug: process.env.NODE_ENV === "production",
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
