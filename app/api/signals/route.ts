//app/api/signals/route.ts

import { NextRequest } from "next/server"

export const runtime = "edge"

const GAS_URL =
  "https://script.google.com/macros/s/AKfycby55ye_dTtWJ-QILNYJIaXWv74_n7n0muh3U--sBl7yowMlp1FzESOokWqeHI75U5_R/exec?key=HEDZ2026"

export async function GET(req: NextRequest) {

  const pair = req.nextUrl.searchParams.get("pair")
  const stream = req.nextUrl.searchParams.get("stream")

  // =========================================
  // NORMAL JSON MODE (unchanged behavior)
  // =========================================
  if (!stream) {

    try {

      const url = pair
        ? `${GAS_URL}&pair=${pair}`
        : GAS_URL

      const res = await fetch(url, { cache: "no-store" })
      const json = await res.json()

      return Response.json(json)

    } catch {

      return Response.json(
        { error: "Signal fetch failed" },
        { status: 500 }
      )
    }
  }

  // ========================================
  // STREAM MODE (NEW)
  // =========================================
  const encoder = new TextEncoder()

  const readable = new ReadableStream({

    async start(controller) {

      let last = ""

      async function push() {

        try {

          const url = pair
            ? `${GAS_URL}&pair=${pair}`
            : GAS_URL

          const res = await fetch(url, { cache: "no-store" })
          const json = await res.json()

          const payload = JSON.stringify(json)

          if (payload !== last) {

            controller.enqueue(
              encoder.encode(`data: ${payload}\n\n`)
            )

            last = payload
          }

        } catch (e) {
          console.log("stream error", e)
        }
      }

      await push()

      const interval = setInterval(push, 2500)

      return () => clearInterval(interval)
    }
  })

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    }
  })
}
