// app/page.tsx

"use client"

import { useEffect, useState, useMemo } from "react"
import PairCard from "@/components/PairCard"
import AccountStrip from "@/components/AccountStrip"
import VerticalSymbolButton from "@/components/VerticalSymbolButton"
import PairDetail from "@/components/PairDetail"

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

type ViewMode = "MIN" | "MAX"

export default function Page() {

  const [signals, setSignals] = useState<any>({})
  const [pairData, setPairData] = useState<any>({})
  const [openPair, setOpenPair] = useState<string | null>(null)  // Track only one expanded pair
  const [authorized, setAuthorized] = useState(false)
  const [uiSignals, setUiSignals] = useState<any>({})
  const [netState, setNetState] = useState("FLAT")
  const [viewMode, setViewMode] = useState<ViewMode>("MIN")
  const [loading, setLoading] = useState(true)

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
// Dev-only override for browser testing
useEffect(() => {
  if (process.env.NODE_ENV === "development") {
    setAuthorized(true)
  }
}, [])

  useEffect(() => {
    if (!authorized) return

    async function loadSignals() {
      try {
        const res = await fetch(SIGNAL_API)
        const json = await res.json()
        const incoming = json?.signals ? json.signals : json
        setLoading(false)

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
    // Toggle between open/close pair expansion
    if (openPair === pair) {
      setOpenPair(null) // Collapse the pair
    } else {
      setOpenPair(pair) // Expand the specific pair
    }
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
          <div className="text-neutral-400 text-[clamp(10px,1.4vw,14px)]">Open via Telegram Bot</div>
        </div>
      </main>
    )
  }

return (
<main
  className="h-[100dvh] bg-black text-white flex flex-col"
style={{ fontSize: "clamp(10px, 0.9vw, 16px)" }}

>

  {/* TOP BAR */}
  <div className="shrink-0 h-[clamp(26px,3vh,40px)]">
    <AccountStrip
      pairs={pairsData}
      onStateChange={(state: string) => {
        setNetState(state)
      }}
    />
  </div>

{/* SCROLL AREA */}
<div className="flex-1 overflow-hidden relative">

  {openPair ? (

<div
  className="absolute inset-0 grid"
  style={{
    gridTemplateColumns: "clamp(30px, 3.5vw, 46px) 1fr",
    gridTemplateRows: "1fr"
  }}
>

      {/* LEFT RAIL */}
      <div className="grid"
        style={{
          gridTemplateRows: "repeat(9, 1fr)"
        }}
      >
        {PAIRS.map((pair) => (
          <VerticalSymbolButton
            key={pair}
            pair={pair}
            active={openPair === pair}
            onClick={() => setOpenPair(pair)}
          />
        ))}
      </div>

      {/* RIGHT DETAIL */}
      <PairDetail
        pair={openPair}
        data={pairData?.[openPair]}
        signal={uiSignals?.[openPair]}
        onClose={() => setOpenPair(null)}
      />

    </div>

  ) : (

    <div
      className="h-full grid"
      style={{
        gridTemplateColumns: "clamp(30px, 3.5vw, 46px) 1fr",
        gridTemplateRows: "repeat(9, 1fr)",
        rowGap: "0px"
      }}
    >
      {PAIRS.map((pair) => {
        const signal = uiSignals?.[pair]

        return (
          <>
            <VerticalSymbolButton
              key={`${pair}_btn`}
              pair={pair}
              active={false}
              onClick={() => setOpenPair(pair)}
            />

            <PairCard
              key={`${pair}_card`}
              pair={pair}
              direction={signal?.direction}
              signal={signal}
              onToggle={() => setOpenPair(pair)}
            />
          </>
        )
      })}
    </div>

  )}

</div>

  {/* BOTTOM BAR */}
  <div className="shrink-0 h-[clamp(26px,3vh,40px)]">
    <div className="bg-neutral-900 border-t border-neutral-800 h-full flex items-center relative px-3">
        <div className="flex items-center gap-2 z-10">
          <div className="w-[clamp(10px,1.5vw,18px)] h-[clamp(10px,1.8vh,22px)] flex flex-col justify-center gap-[2px] cursor-pointer">
            <div className="h-[clamp(1px,0.2vw,3px)] w-full bg-neutral-400" />
            <div className="h-[clamp(1px,0.2vw,3px)] w-full bg-neutral-400" />
            <div className="h-[clamp(1px,0.2vw,3px)] w-full bg-neutral-400" />
          </div>
          <div className="text-[clamp(10px,1.8vh,22px)] font-semibold leading-none">
            FXHEDZ
          </div>
        </div>

        <div className="ml-auto text-right z-10 flex flex-col items-end">
          <div className="text-[clamp(7px,0.9vh,12px)] leading-[11px]">
            ZEROLOSS COMPOUNDED
          </div>
          <div className="text-[clamp(8px,1vh,14px)] text-neutral-500 leading-[11px]">
            HEDGING SYSTEM
          </div>
        </div>

      </div>
    </div>

  </main>
)
}
