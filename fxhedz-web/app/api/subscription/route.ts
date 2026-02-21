import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {

  const deviceId = req.cookies.get("fx_device")?.value
  const fingerprint = req.nextUrl.searchParams.get("fingerprint") || ""

  if (!deviceId) {
    return NextResponse.json({
      active: false,
      blocked: true,
      status: null,
      expiry: null
    })
  }

  try {

    const res = await fetch(
      `${process.env.GAS_AUTH_URL}?secret=${process.env.GAS_SECRET}&device_id=${deviceId}&fingerprint=${encodeURIComponent(fingerprint)}`,
      { cache: "no-store" }
    )

    const data = await res.json()

    return NextResponse.json({
      active: Boolean(data?.active),
      blocked: Boolean(data?.blocked),
      status: data?.plan ?? null,
      expiry: data?.expiry ?? null
    })

  } catch {

    return NextResponse.json({
      active: false,
      blocked: true,
      status: null,
      expiry: null
    })
  }
}