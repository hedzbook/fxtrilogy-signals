import NextAuth, { type NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async signIn({ user }) {
      try {
        if (user?.email) {
          await fetch(process.env.GAS_AUTH_URL!, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: user.email
            }),
          })
        }
      } catch (e) {
        console.error("Auth sync failed:", e)
      }

      return true
    }
  }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
