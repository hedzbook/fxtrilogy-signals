"use client"

import { useEffect, useState, useMemo } from "react"
import PairCard from "@/components/PairCard"
import AccountStrip from "@/components/AccountStrip"

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
  const [pairData, setPairData] = useState<any>({})
  const [openPair, setOpenPair] = useState<string | null>(null)
  const [authorized, setAuthorized] = useState(false)
  const [uiSignals, setUiSignals] = useState<any>({})
  const [netState, setNetState] = useState("FLAT")
  const [netIntensity, setNetIntensity] = useState(0)
  const [liquidityPulse, setLiquidityPulse] = useState(0)

  // ======================================================
  // TELEGRAM MINIAPP GUARD
  // ======================================================
  useEffect(() => {

    const tg = (window as any)?.Telegram?.WebApp

    if (tg && tg.initDataUnsafe?.user?.id) {

      tg.ready()
      tg.expand()
      tg.disableVerticalSwipes()
      tg.setBackgroundColor("#000000")
      tg.setHeaderColor("#000000")

      document.documentElement.style.height = "100%"
      document.body.style.minHeight = "100vh"
      document.body.style.overscrollBehavior = "none"
      document.body.style.touchAction = "pan-y"
      setAuthorized(true)

    } else {
      console.log("Blocked: Not opened via Telegram")
      setAuthorized(false)
    }

  }, [])

  // ======================================================
  // GLOBAL LIVE SIGNALS LOOP (LIGHTWEIGHT)
  // ======================================================
  useEffect(() => {

    if (!authorized) return

    async function loadSignals() {

      try {

        const res = await fetch(SIGNAL_API)
        const json = await res.json()

        const incoming = json?.signals ? json.signals : json

        setSignals((prev: any) => {

          if (JSON.stringify(prev) === JSON.stringify(incoming)) {
            return prev
          }

          return incoming
        })

      } catch (err) {
        console.log("Signal fetch error", err)
      }
    }

    loadSignals()

    const interval = setInterval(loadSignals, 2500)

    return () => clearInterval(interval)

  }, [authorized])

  // ======================================================
  // DYNAMIC TICK STABILIZER (ADAPTIVE SMOOTHING - SAFE)
  // ======================================================
  useEffect(() => {

    let delay = 80

    try {

      let totalMove = 0
      let count = 0

      PAIRS.forEach(pair => {

        const newPrice = Number(signals?.[pair]?.price)
        const oldPrice = Number(uiSignals?.[pair]?.price)

        if (newPrice && oldPrice) {
          totalMove += Math.abs(newPrice - oldPrice)
          count++
        }

      })

      const avgMove = count ? totalMove / count : 0

      if (avgMove > 1) delay = 160
      else if (avgMove > 0.2) delay = 120
      else delay = 70

    } catch { }

    const timer = setTimeout(() => {
      setUiSignals((prev: any) => {
        // 🔥 prevent useless updates
        if (JSON.stringify(prev) === JSON.stringify(signals)) return prev
        return signals
      })
    }, delay)

    return () => clearTimeout(timer)

  }, [signals])

  // ======================================================
  // 🔥 OPEN PAIR REFRESH LOOP
  // ======================================================
  useEffect(() => {

    if (!authorized || !openPair) return

    const pairKey = openPair

    let cancelled = false

    async function refreshOpenPair() {

      try {

        const res = await fetch(`/api/signals?pair=${pairKey}`)
        const json = await res.json()

        if (cancelled) return

        setPairData((prev: any) => ({
          ...prev,
          [pairKey]: json
        }))

      } catch (err) {
        console.log("Refresh pair error", err)
      }
    }

    refreshOpenPair()

    const interval = setInterval(refreshOpenPair, 6000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }

  }, [authorized, openPair])

  // ======================================================
  // LAZY LOAD PAIR DATA
  // ======================================================
  async function loadPair(pair: string) {

    if (pairData[pair]) return

    try {

      const res = await fetch(`/api/signals?pair=${pair}`)
      const json = await res.json()

      setPairData((prev: any) => ({
        ...prev,
        [pair]: json
      }))

    } catch (err) {
      console.log("Pair load error", err)
    }
  }

  // ======================================================
  // TOGGLE HANDLER
  // ======================================================
  function togglePair(pair: string) {
    setOpenPair(prev => {

      const next = prev === pair ? null : pair

      if (next) {
        if ("requestIdleCallback" in window) {
          (window as any).requestIdleCallback(() => loadPair(next))
        } else {
          setTimeout(() => loadPair(next), 0)
        }
      }

      return next
    })
  }

  // ======================================================
  // ACCESS BLOCK SCREEN
  // ======================================================
  if (!authorized) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-xl font-bold">FXHEDZ</div>
          <div className="text-neutral-400 text-sm">
            Open via Telegram Bot to access signals
          </div>
        </div>
      </main>
    )
  }

  // ======================================================
  // 🔥 BUILD GLOBAL PAIRS DATA (FOR ACCOUNT STRIP)
  // ======================================================
  const pairsData = useMemo(() => {

    return PAIRS.map((pair) => {

      const signal = uiSignals?.[pair]
      const extra = pairData?.[pair] || {}

      return {
        pair,
        signal,
        orders: extra?.orders || []
      }
    })

  }, [uiSignals, pairData])

  // ======================================================
  // MAIN UI
  // ======================================================
  return (
    <main
      className="min-h-screen text-white p-4 space-y-3 transition-all duration-700"
      style={{
        transform: `scale(${1 + liquidityPulse * 0.002})`,
        background:
          netState === "NET BUY"
            ? `radial-gradient(circle at top, rgba(34,197,94,${0.04 + netIntensity * 0.12}), #000000)`
            : netState === "NET SELL"
              ? `radial-gradient(circle at top, rgba(248,113,113,${0.04 + netIntensity * 0.12}), #000000)`
              : netState === "HEDGED"
                ? `radial-gradient(circle at top, rgba(56,189,248,${0.03 + netIntensity * 0.08}), #000000)`
                : "#000000"
      }}
    >

      {/* 🔥 GLOBAL ACCOUNT RISK STRIP */}
      <AccountStrip
        pairs={pairsData}
        onStateChange={(state: string, intensity: number, pulse: number) => {
          setNetState(state)
          setNetIntensity(intensity)
          setLiquidityPulse(pulse)
        }}
      />

      {PAIRS.map((pair) => {

        const signal = uiSignals?.[pair]
        const extra = pairData?.[pair] || {}

        return (
          <PairCard
            key={pair}
            pair={pair}
            open={openPair === pair}
            direction={signal?.direction}
            signal={signal}
            history={extra?.history}
            orders={extra?.orders}   // ✅ ADDED
            performance={extra?.performance}
            notes={extra?.notes}
            onToggle={() => togglePair(pair)}
          />
        )
      })}

    </main>
  )
}
