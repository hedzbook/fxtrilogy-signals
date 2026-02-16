"use client"

import { useEffect, useState, useMemo } from "react"
import PairCard from "@/components/PairCard"
import AccountStrip from "@/components/AccountStrip"

const PAIRS = [
  "XAUUSD",
  "BTCUSD",
  "ETHUSD",
  "EURUSD",
  "GBPUSD",
  "USDJPY",
  "AUDUSD",
  "USDCHF",
  "USOIL"
]

const SIGNAL_API = "/api/signals"

type ViewMode = "MIN" | "MID" | "MAX"

export default function Page() {

  const [signals, setSignals] = useState<any>({})
  const [pairData, setPairData] = useState<any>({})
  const [openPair, setOpenPair] = useState<string | null>(null)
  const [authorized, setAuthorized] = useState(false)
  const [uiSignals, setUiSignals] = useState<any>({})
  const [netState, setNetState] = useState("FLAT")
  const [viewMode, setViewMode] = useState<ViewMode>("MID")

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
      setAuthorized(false)
    }

  }, [])

  useEffect(() => {

    if (!authorized) return

    async function loadSignals() {
      try {
        const res = await fetch(SIGNAL_API)
        const json = await res.json()
        const incoming = json?.signals ? json.signals : json

        setSignals((prev: any) => {
          if (JSON.stringify(prev) === JSON.stringify(incoming)) return prev
          return incoming
        })

      } catch { }
    }

    loadSignals()
    const interval = setInterval(loadSignals, 2500)
    return () => clearInterval(interval)

  }, [authorized])

  useEffect(() => {

    const timer = setTimeout(() => {
      setUiSignals((prev: any) => {
        if (JSON.stringify(prev) === JSON.stringify(signals)) return prev
        return signals
      })
    }, 90)

    return () => clearTimeout(timer)

  }, [signals])

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

      } catch { }
    }

    refreshOpenPair()
    const interval = setInterval(refreshOpenPair, 6000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }

  }, [authorized, openPair])

  function togglePair(pair: string) {
    if (viewMode === "MIN") return
    setOpenPair(prev => prev === pair ? null : pair)
  }

  const pairsData = useMemo(() => {
    return PAIRS.map((pair) => {
      const signal = uiSignals?.[pair]
      const extra = pairData?.[pair] || {}
      return { pair, signal, orders: extra?.orders || [] }
    })
  }, [uiSignals, pairData])

  if (!authorized) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-xl font-bold">FXHEDZ</div>
          <div className="text-neutral-400 text-sm">
            Open via Telegram Bot
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen text-white pb-16 transition-all duration-500 bg-black">

      {/* TOP STRIP */}
      <div className="fixed top-0 left-0 right-0 z-50 h-10">
        <AccountStrip
          pairs={pairsData}
          onStateChange={(state: string) => {
            setNetState(state)
          }}
        />
      </div>

      <div className="pt-16 px-4 space-y-3">

        {PAIRS.map((pair) => {

          const signal = uiSignals?.[pair]
          const extra = pairData?.[pair] || {}

          return (
            <PairCard
              key={pair}
              pair={pair}
              open={viewMode === "MAX" ? true : openPair === pair}
              direction={signal?.direction}
              signal={signal}
              history={extra?.history}
              orders={extra?.orders}
              performance={extra?.performance}
              notes={extra?.notes}
              viewMode={viewMode}
              onToggle={() => togglePair(pair)}
            />
          )
        })}

      </div>

{/* ============================== 
   BOTTOM CONTROL BAR
============================== */}
<div className="fixed bottom-0 left-0 right-0 z-50 h-10">

  <div className="bg-neutral-900 border-t border-neutral-800 h-full flex items-center relative px-[17px] shadow-[0_-8px_30px_rgba(0,0,0,0.6)]">

    {/* LEFT SIDE */}
    <div className="flex items-center gap-2 z-10">

<div className="w-2 h-5 flex flex-col justify-center gap-[2px] cursor-pointer">
  <div className="h-[2px] w-2 bg-neutral-400" />
  <div className="h-[2px] w-2 bg-neutral-400" />
  <div className="h-[2px] w-2 bg-neutral-400" />
</div>

      <div className="text-[15px] font-semibold tracking-wide leading-none">
        FXHEDZ
      </div>

    </div>

    {/* CENTER TOGGLE */}
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">

      <button
        onClick={() => {
          if (viewMode === "MIN") {
            setViewMode("MID")
          } else if (viewMode === "MID") {
            setViewMode("MAX")
          } else {
            setViewMode("MIN")
            setOpenPair(null)
          }
        }}
        className={`
          pointer-events-auto
          w-12 h-6 rounded-full transition-all duration-300 relative
          ${viewMode === "MIN"
            ? "bg-neutral-700"
            : viewMode === "MID"
              ? "bg-neutral-600"
              : "bg-neutral-500"}
        `}
      >
        <div
          className={`
            absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white transition-all duration-300
            ${viewMode === "MIN"
              ? "left-1"
              : viewMode === "MID"
                ? "left-1/2 -translate-x-1/2"
                : "right-1"}
          `}
        />
      </button>

    </div>

{/* RIGHT SIDE */}
<div className="ml-auto text-right z-10 flex flex-col items-end">
  
  <div className="text-[7px] font-medium tracking-[0.5px] leading-[11px]">
    ZEROLOSS COMPOUNDED
  </div>

  <div className="text-[9px] text-neutral-500 tracking-[0.5px] leading-[11px]">
    HEDGING SYSTEM
  </div>

</div>

  </div>
</div>

    </main>
  )
}

/* =========================================
   VIEW MODE ICON (NO TEXT)
========================================= */

function ViewIcon({
  size,
  active,
  onClick
}: {
  size: "small" | "medium" | "large"
  active: boolean
  onClick: () => void
}) {

  const dimension =
    size === "small"
      ? "w-3 h-3"
      : size === "medium"
        ? "w-4 h-4"
        : "w-5 h-5"

  return (
    <button
      onClick={onClick}
      className={`${dimension} rounded-sm transition-all duration-200
        ${active
          ? "bg-white"
          : "bg-neutral-700 hover:bg-neutral-500"
        }`}
    />
  )
}
