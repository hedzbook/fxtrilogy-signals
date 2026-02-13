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

const SIGNAL_API = "/api/signals"

export default function Page() {

  const [signals, setSignals] = useState<any>({})
  const [openPair, setOpenPair] = useState<string | null>(null)
  const [authorized, setAuthorized] = useState(false)

  // ✅ Telegram Mini App + Access Guard
  useEffect(() => {

    const tg = (window as any)?.Telegram?.WebApp

    if (tg && tg.initDataUnsafe?.user?.id) {
      tg.ready()
      // tg.expand()
      tg.disableVerticalSwipes()
      document.body.style.backgroundColor =
        tg.themeParams.bg_color || "#000"

      setAuthorized(true)
    } else {
      console.log("Blocked: Not opened via Telegram")
      setAuthorized(false)
    }

  }, [])

  // 🚀 LIVE SIGNAL REFRESH
  useEffect(() => {

    if (!authorized) return

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

  }, [authorized])

  if (!authorized) {
    return (
      <main className="min-h-[100dvh] pb-[env(safe-area-inset-bottom)] bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-xl font-bold">FXHEDZ</div>
          <div className="text-neutral-400 text-sm">
            Open via Telegram Bot to access signals
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[100dvh] pb-[env(safe-area-inset-bottom)] bg-black text-white p-4 space-y-2">
      {/* <h1 className="text-xl font-bold">FXHEDZ Signals</h1> */}

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
