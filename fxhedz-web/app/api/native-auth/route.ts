import { NextRequest, NextResponse } from "next/server"
import { OAuth2Client } from "google-auth-library"
import jwt from "jsonwebtoken"
import crypto from "crypto"

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

const ACCESS_EXPIRES_IN = "15m"
const REFRESH_EXPIRES_DAYS = 14

export async function POST(req: NextRequest) {
  try {
    const { idToken, deviceId } = await req.json()

    if (!idToken || !deviceId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    // 🔹 Verify Google token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    })

    const payload = ticket.getPayload()

    if (!payload?.email) {
      return NextResponse.json({ error: "Invalid Google token" }, { status: 401 })
    }

    const email = payload.email.toLowerCase()

    // 🔹 Generate refresh token
    const refreshToken = crypto.randomBytes(64).toString("hex")

    const refreshHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex")

    const refreshExpires = new Date()
    refreshExpires.setDate(refreshExpires.getDate() + REFRESH_EXPIRES_DAYS)

    // 🔹 Call GAS to register device + refresh token
const gasRes = await fetch(process.env.GAS_AUTH_URL!, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email,
    device_id: deviceId,
    fingerprint: deviceId, // 🔥 use deviceId as fingerprint for android
    platform: "android",
    refresh_token_hash: refreshHash,
    refresh_expires: refreshExpires.toISOString()
  })
})

    const gasData = await gasRes.json()

    if (gasData.blocked) {
      return NextResponse.json(
        { error: "Device blocked or limit exceeded" },
        { status: 403 }
      )
    }

    if (!gasData.active) {
      return NextResponse.json(
        { error: "Subscription inactive" },
        { status: 403 }
      )
    }

    // 🔹 Issue short-lived access token
    const accessToken = jwt.sign(
      { email, deviceId },
      process.env.FXHEDZ_SECRET!,
      { expiresIn: ACCESS_EXPIRES_IN }
    )

    return NextResponse.json({
      accessToken,
      refreshToken,
      email
    })

  } catch (err) {
    return NextResponse.json({ error: "Auth failed" }, { status: 401 })
  }
}