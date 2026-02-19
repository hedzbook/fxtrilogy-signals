import { NextResponse } from "next/server"

const GAS_BASE =
  "https://script.google.com/macros/s/AKfycby55ye_dTtWJ-QILNYJIaXWv74_n7n0muh3U--sBl7yowMlp1FzESOokWqeHI75U5_R/exec"

export async function GET() {
  try {
    const res = await fetch(
      `${GAS_BASE}?secret=${process.env.GAS_SECRET}&pair=XAUUSD`,
      {
        next: { revalidate: 10 }
      }
    )

    const json = await res.json()

    return NextResponse.json({
      direction: json?.direction,
      price: json?.price,
      entry: json?.entry,
      sl: json?.sl,
      tp: json?.tp,
      candles: json?.candles?.slice(-40) || []
    })

  } catch {
    return NextResponse.json(
      { error: "Preview unavailable" },
      { status: 500 }
    )
  }
}
