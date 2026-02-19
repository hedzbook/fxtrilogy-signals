import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"

export async function GET() {

  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ active: false })
  }

  const res = await fetch(
    `${process.env.GAS_AUTH_URL}?email=${session.user.email}`
  )

  const data = await res.json()

  return NextResponse.json(data)
}
