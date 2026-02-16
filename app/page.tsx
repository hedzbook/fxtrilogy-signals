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
      {/* 🔥 BOTTOM CONTROL BAR — SAME HEIGHT */}
      <div className="fixed bottom-0 left-0 right-0 z-50 h-10">

        <div className="bg-neutral-900 border-t border-neutral-800 h-full flex items-center justify-between px-[18px] shadow-[0_-8px_30px_rgba(0,0,0,0.6)]">

          {/* ================= LEFT SIDE ================= */}
          <div className="flex items-center gap-2">

            {/* LOGO */}
            <img
              src="/public/favicon.png"
              alt="Logo"
              className="h-[26px] w-auto object-contain"
            />

            {/* TEXT BLOCK */}
            <div className="leading-tight">
              <div className="text-[10px] font-semibold tracking-wide">
                ZEROLOSS
              </div>
              <div className="text-[9px] text-neutral-400 tracking-wider">
                COMPOUNDED HEDGING SYSTEM
              </div>
            </div>

          </div>

          {/* ================= RIGHT SIDE ================= */}
          <div className="flex items-center gap-3">

            {/* VIEW MODE BUTTONS (NO TEXT — DIFFERENT SIZES) */}
            <div className="flex items-center gap-2">

              {/* MIN */}
              <button
                onClick={() => {
                  setViewMode("MIN")
                  setOpenPair(null)
                }}
                className={`transition-all duration-200
            ${viewMode === "MIN"
                    ? "bg-white"
                    : "bg-neutral-700 hover:bg-neutral-500"
                  }`}
                style={{ width: 12, height: 12 }}
              />

              {/* MID */}
              <button
                onClick={() => setViewMode("MID")}
                className={`transition-all duration-200
            ${viewMode === "MID"
                    ? "bg-white"
                    : "bg-neutral-700 hover:bg-neutral-500"
                  }`}
                style={{ width: 16, height: 16 }}
              />

              {/* MAX */}
              <button
                onClick={() => setViewMode("MAX")}
                className={`transition-all duration-200
            ${viewMode === "MAX"
                    ? "bg-white"
                    : "bg-neutral-700 hover:bg-neutral-500"
                  }`}
                style={{ width: 20, height: 20 }}
              />

            </div>

            {/* HAMBURGER — 7PX FROM RIGHT */}
            <div className="w-6 h-6 flex flex-col justify-center gap-1 cursor-pointer">
              <div className="h-[2px] bg-neutral-400" />
              <div className="h-[2px] bg-neutral-400" />
              <div className="h-[2px] bg-neutral-400" />
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
