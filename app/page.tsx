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
      setAuthorized(false)
    }

  }, [])

  // ======================================================
  // GLOBAL SIGNAL LOOP
  // ======================================================
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

  // ======================================================
  // SMOOTH UI SYNC
  // ======================================================
  useEffect(() => {

    const timer = setTimeout(() => {
      setUiSignals((prev: any) => {
        if (JSON.stringify(prev) === JSON.stringify(signals)) return prev
        return signals
      })
    }, 90)

    return () => clearTimeout(timer)

  }, [signals])

  // ======================================================
  // OPEN PAIR REFRESH
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

      } catch { }
    }

    refreshOpenPair()
    const interval = setInterval(refreshOpenPair, 6000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }

  }, [authorized, openPair])

  // ======================================================
  // TOGGLE HANDLER
  // ======================================================
  function togglePair(pair: string) {

    if (viewMode === "MIN") return

    setOpenPair(prev => prev === pair ? null : pair)
  }

  // ======================================================
  // ACCOUNT STRIP DATA
  // ======================================================
  const pairsData = useMemo(() => {

    return PAIRS.map((pair) => {
      const signal = uiSignals?.[pair]
      const extra = pairData?.[pair] || {}
      return { pair, signal, orders: extra?.orders || [] }
    })

  }, [uiSignals, pairData])

  // ======================================================
  // ACCESS BLOCK
  // ======================================================
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

  // ======================================================
  // MAIN UI
  // ======================================================
  return (
    <main
      className="min-h-screen text-white pb-24 transition-all duration-500"
      style={{
        background:
          netState === "NET BUY"
            ? `radial-gradient(circle at top, rgba(34,197,94,0.08), #000)`
            : netState === "NET SELL"
              ? `radial-gradient(circle at top, rgba(248,113,113,0.08), #000)`
              : "#000"
      }}
    >

      {/* ======================================================
          🔥 STICKY TOP ACCOUNT STRIP
      ====================================================== */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <AccountStrip
          pairs={pairsData}
          onStateChange={(state: string) => {
            setNetState(state)
          }}
        />
      </div>

      {/* CONTENT WRAPPER WITH TOP OFFSET */}
      <div className="pt-20 px-4 space-y-3">

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

      {/* ======================================================
          🔥 STICKY BOTTOM CONTROL BAR
      ====================================================== */}
      <div className="fixed bottom-0 left-0 right-0 z-50">

        <div className="bg-neutral-900 border-t border-neutral-800 h-16 flex items-center justify-between px-4 shadow-[0_-8px_30px_rgba(0,0,0,0.6)]">

          <div className="flex gap-3">

            <ModeBtn
              label="MIN"
              active={viewMode === "MIN"}
              onClick={() => {
                setViewMode("MIN")
                setOpenPair(null)
              }}
            />

            <ModeBtn
              label="MID"
              active={viewMode === "MID"}
              onClick={() => setViewMode("MID")}
            />

            <ModeBtn
              label="MAX"
              active={viewMode === "MAX"}
              onClick={() => setViewMode("MAX")}
            />

          </div>

          <div className="w-8 h-8 flex flex-col justify-center gap-1 cursor-pointer">
            <div className="h-[2px] bg-neutral-400" />
            <div className="h-[2px] bg-neutral-400" />
            <div className="h-[2px] bg-neutral-400" />
          </div>

        </div>
      </div>

    </main>
  )
}

/* ======================================================
   MODE BUTTON
====================================================== */

function ModeBtn({
  label,
  active,
  onClick
}: {
  label: string
  active: boolean
  onClick: () => void
}) {

  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-md text-xs font-semibold transition-all duration-200
        ${active
          ? "bg-white text-black"
          : "bg-neutral-800 text-neutral-400 hover:text-white"
        }`}
    >
      {label}
    </button>
  )
}
