"use client"

import { useEffect, useState } from "react"
import PairCard from "@/components/PairCard"

const PAIRS = [
  "XAUUSD",
  "BTCUSD",
  "ETHUSD",
  "EURUSD",
  "AUDUSD",
  "GBPUSD",
  "USDJPY",
  "GBPJPY",
  "USDCHF",
  "USDCAD"
]

const SIGNAL_API =
  "https://script.google.com/macros/s/AKfycbyY5Ku5nk6gZRMxffgfseVnYCUywlQYQM8qEfFzZjLLYEpV-g7cdCjrH6a3sK8IGnGt/exec?key=HEDZ2026"

export default function Page() {

  const [signals, setSignals] = useState<any>({})
  const [openPair, setOpenPair] = useState<string | null>(null)

  // ✅ Telegram Mini App setup
  useEffect(() => {
    const tg = (window as any)?.Telegram?.WebApp
    if (tg) {
      tg.ready()
      tg.expand()
      tg.disableVerticalSwipes()
      document.body.style.backgroundColor =
        tg.themeParams.bg_color || "#000"
    }
  }, [])

  // 🚀 LIVE SIGNAL REFRESH
  useEffect(() => {

    async function loadSignals() {
      try {
        const res = await fetch(SIGNAL_API)
        const json = await res.json()
        setSignals(json)
      } catch (err) {
        console.log("Signal fetch error", err)
      }
    }

    loadSignals()
    const interval = setInterval(loadSignals, 10000)

    return () => clearInterval(interval)

  }, [])

  return (
    <main className="min-h-screen bg-black text-white p-4 space-y-3">
      <h1 className="text-xl font-bold">FxTrilogy Signals</h1>

      {PAIRS.map(pair => {

        const signal = signals[pair]

        return (
          <PairCard
            key={pair}
            pair={pair}
            open={openPair === pair}
            direction={signal?.direction}
            signal={signal}
            onToggle={() =>
              setOpenPair(openPair === pair ? null : pair)
            }
          />
        )
      })}
    </main>
  )
}
