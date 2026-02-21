import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "unauthorized" },
        { status: 401 }
      )
    }

    const res = await fetch(process.env.GAS_AUTH_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: session.user.email,
        reset_devices: true
      })
    })

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: "gas_failed" },
        { status: 500 }
      )
    }

    const data = await res.json()

    return NextResponse.json(data)

  } catch (err) {
    return NextResponse.json(
      { success: false, error: "server_error" },
      { status: 500 }
    )
  }
}