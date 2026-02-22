import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import crypto from "crypto"

const ACCESS_EXPIRES_IN = "15m"

export async function POST(req: NextRequest) {
  try {
    const { refreshToken, deviceId, email } = await req.json()

    if (!refreshToken || !deviceId || !email) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    // 🔐 Hash incoming refresh token
    const refreshHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex")

    // 🔎 Ask GAS to validate
    const gasRes = await fetch(process.env.GAS_AUTH_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        refresh_validate: true,
        email,
        device_id: deviceId,
        refresh_token_hash: refreshHash
      })
    })

    const gasData = await gasRes.json()

    if (!gasData.valid) {
      return NextResponse.json(
        { error: "Invalid refresh token" },
        { status: 401 }
      )
    }

    // 🔹 Issue new access token
    const accessToken = jwt.sign(
      { email, deviceId },
      process.env.FXHEDZ_SECRET!,
      { expiresIn: ACCESS_EXPIRES_IN }
    )

    return NextResponse.json({ accessToken })

  } catch {
    return NextResponse.json({ error: "Refresh failed" }, { status: 401 })
  }
}