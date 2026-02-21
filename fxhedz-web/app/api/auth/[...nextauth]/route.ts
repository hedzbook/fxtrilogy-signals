import NextAuth, { type NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { cookies } from "next/headers"

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

      const cookieStore = await cookies()
      const deviceId = cookieStore.get("fx_device")?.value || ""
      const fingerprint = cookieStore.get("fx_fp")?.value || ""

      // Detect platform
      let platform = "web"
      let telegramChatId = ""

      // Telegram detection must happen client-side,
      // so we rely on a cookie set by frontend

      const tgCookie = cookieStore.get("fx_platform")?.value
      const tgIdCookie = cookieStore.get("fx_tg_id")?.value

      if (tgCookie === "telegram") {
        platform = "telegram"
        telegramChatId = tgIdCookie || ""
      }

      await fetch(process.env.GAS_AUTH_URL!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          device_id: deviceId,
          fingerprint: fingerprint,
          platform: platform,
          telegram_chat_id: telegramChatId
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
