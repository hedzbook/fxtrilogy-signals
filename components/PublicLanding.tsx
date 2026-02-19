"use client"

import { useEffect, useState } from "react"
import AuthButton from "./AuthButton"

export default function PublicLanding() {

  const [preview, setPreview] = useState<any>(null)

  useEffect(() => {
    async function loadPreview() {
      try {
        const res = await fetch("/api/public-preview")
        const json = await res.json()
        setPreview(json)
      } catch {}
    }

    loadPreview()
  }, [])

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">

      {/* HERO */}
      <div className="text-center max-w-2xl space-y-6">

        <h1 className="text-4xl font-bold tracking-tight">
          Institutional-Grade Forex Signal Engine
        </h1>

        <p className="text-neutral-400">
          Live MT5 execution · Hedged logic · Real-time candle stream
        </p>

        <div className="flex justify-center pt-4">
          <AuthButton />
        </div>

      </div>

      {/* LIVE PREVIEW */}
      {preview && (
        <div className="mt-16 w-full max-w-xl bg-neutral-900 border border-neutral-800 p-6 rounded-lg">

          <div className="flex justify-between items-center mb-4">
            <div className="font-semibold text-lg">
              XAUUSD
            </div>
            <div className={`font-bold ${
              preview.direction === "BUY"
                ? "text-green-400"
                : preview.direction === "SELL"
                  ? "text-red-400"
                  : "text-neutral-400"
            }`}>
              {preview.direction || "--"}
            </div>
          </div>

          <div className="text-neutral-400 text-sm">
            Entry {preview.entry || "--"} · SL {preview.sl || "--"} · TP {preview.tp || "--"}
          </div>

        </div>
      )}

      {/* LOCKED SECTION */}
      <div className="mt-12 text-center text-neutral-500">
        Unlock 9 Instruments · Full History · Live Orders
      </div>

    </main>
  )
}
