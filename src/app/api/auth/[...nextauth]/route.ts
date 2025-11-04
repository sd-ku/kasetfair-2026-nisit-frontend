// import NextAuth, { type NextAuthOptions } from "next-auth"
// import GoogleProvider from "next-auth/providers/google"

// export const authOptions: NextAuthOptions = {
//   session: { strategy: "jwt" },
//   providers: [
//     GoogleProvider({
//       clientId: process.env.GOOGLE_CLIENT_ID!,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
//     }),
//   ],
//   callbacks: {
//     async jwt({ token, account }) {
//       // ครั้งแรกหลัง login เสร็จ (เอา id_token ไว้ให้ client ใช้)
//       if (account?.id_token) token.id_token = account.id_token
//       return token
//     },
//     async session({ session, token }) {
//       // ให้ session ถือ id_token ไปใช้ fetch /auth/exchange เองที่ฝั่ง client
//       (session as any).id_token = token.id_token
//       return session
//     },
//   },
//   debug: process.env.NODE_ENV === "development", // ให้แสดง log แค่ตอน dev
// }

// const handler = NextAuth(authOptions)
// export { handler as GET, handler as POST }


import NextAuth, { type NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [GoogleProvider({ clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET! })],
  callbacks: {
    async jwt({ token, account, trigger, session }) {
      // รอบแรก: รับ id_token จาก Google
      if (account?.id_token) token.id_token = account.id_token

      // หลัง client บอกว่าลงคุกกี้เสร็จแล้ว → เคลียร์
      if (trigger === "update" && (session as any)?.exchanged === true) {
        delete (token as any).id_token
        ;(token as any).exchanged = true
      }
      return token
    },
    async session({ session, token }) {
      // ส่ง id_token ให้ client เฉพาะถ้ายังไม่แลก
      if (!(token as any).exchanged && (token as any).id_token) {
        ;(session as any).id_token = (token as any).id_token
      } else {
        delete (session as any).id_token
      }
      return session
    },
  },
  debug: process.env.NODE_ENV === "development",
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }