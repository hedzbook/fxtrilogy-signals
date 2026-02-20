import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"

const GAS_BASE =
  "https://script.google.com/macros/s/AKfycby55ye_dTtWJ-QILNYJIaXWv74_n7n0muh3U--sBl7yowMlp1FzESOokWqeHI75U5_R/exec"

export async function GET(req: NextRequest) {

  // =====================================
  // 1️⃣ DEVICE CHECK (MANDATORY)
  // =====================================
  const deviceId = req.cookies.get("fx_device")?.value

  if (!deviceId) {
    return NextResponse.json({ error: "No device" }, { status: 401 })
  }

const fingerprint = req.nextUrl.searchParams.get("fingerprint") || ""

const accessRes = await fetch(
  `${process.env.GAS_AUTH_URL}?secret=${process.env.GAS_SECRET}&device_id=${deviceId}&fingerprint=${encodeURIComponent(fingerprint)}`
)

  const access = await accessRes.json()

  if (!access?.active) {
    return NextResponse.json({ error: "Expired" }, { status: 403 })
  }

  // =====================================
  // 2️⃣ OPTIONAL EMAIL CHECK (IF LOGGED IN)
  // =====================================
  const session = await getServerSession(authOptions)

  if (session?.user?.email) {

    const subRes = await fetch(
      `${process.env.GAS_AUTH_URL}?secret=${process.env.GAS_SECRET}&email=${session.user.email}`
    )

    const subData = await subRes.json()

    if (!subData?.active) {
      return NextResponse.json(
        { error: "Subscription required" },
        { status: 403 }
      )
    }
  }

  // =====================================
  // 3️⃣ NORMAL SIGNAL FLOW
  // =====================================
  const pair = req.nextUrl.searchParams.get("pair")

  try {

const url = pair
  ? `${GAS_BASE}?secret=${process.env.GAS_SECRET}&pair=${pair}&device_id=${deviceId}&fingerprint=${encodeURIComponent(fingerprint)}`
  : `${GAS_BASE}?secret=${process.env.GAS_SECRET}&device_id=${deviceId}&fingerprint=${encodeURIComponent(fingerprint)}`

    const res = await fetch(url, { cache: "no-store" })
    const json = await res.json()

    return NextResponse.json(json)

  } catch {

    return NextResponse.json(
      { error: "Signal fetch failed" },
      { status: 500 }
    )
  }
}
