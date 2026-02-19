"use client"

import React, { useEffect, useState, useMemo } from "react"
import PairCard from "@/components/PairCard"
import AccountStrip from "@/components/AccountStrip"
import VerticalSymbolButton from "@/components/VerticalSymbolButton"
import PairDetail from "@/components/PairDetail"
import AuthButton from "@/components/AuthButton"
import { useSession } from "next-auth/react"

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
  const [uiSignals, setUiSignals] = useState<any>({})
  const [netState, setNetState] = useState("FLAT")
  const [viewMode, setViewMode] = useState<ViewMode>("MIN")
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const { data: session, status } = useSession()
  const [subActive, setSubActive] = useState<boolean | null>(null)
  const isAuthorized = session && subActive === true

  useEffect(() => {

    if (!session || subActive !== true) return

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

  }, [session, subActive])

  // =============================
  // CHECK SUBSCRIPTION STATUS
  // =============================
  useEffect(() => {

    if (!session) return

    async function checkSubscription() {
      try {
        const res = await fetch("/api/subscription")
        const data = await res.json()
        setSubActive(data.active)
      } catch {
        setSubActive(false)
      }
    }

    checkSubscription()

  }, [session])

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
    if (!openPair) return

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
  }, [openPair])

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

  if (status === "loading") {
    return (
      <main className="h-screen bg-black flex items-center justify-center text-neutral-500">
        Loading...
      </main>
    )
  }

  return (
    <div className="relative">

      <main
        className={`h-[100dvh] bg-black text-white flex flex-col transition-all duration-300 ${!isAuthorized ? "blur-[2px] opacity-80 pointer-events-none select-none" : ""
          }`}
        style={{ fontSize: "clamp(10px, 0.9vw, 16px)" }}
      >

        {/* TOP BAR */}
        <div
          className="shrink-0 grid border-b border-neutral-800"
          style={{
            gridTemplateColumns: "clamp(30px, 3.5vw, 46px) 1fr",
            height: "clamp(26px,3vh,40px)"
          }}
        >

          {/* TOP LEFT BUTTON */}
          <button
            className="border-r border-neutral-800 bg-neutral-950 hover:bg-neutral-900"
          >
          </button>

          {/* ACCOUNT STRIP */}
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
                  <React.Fragment key={pair}>
                    <VerticalSymbolButton
                      pair={pair}
                      active={false}
                      onClick={() => setOpenPair(pair)}
                    />

                    <PairCard
                      pair={pair}
                      direction={signal?.direction}
                      signal={signal}
                      onToggle={() => setOpenPair(pair)}
                    />
                  </React.Fragment>
                )
              })}
            </div>

          )}

        </div>

        {/* BOTTOM BAR */}
        <div
          className="shrink-0 grid border-t border-neutral-800 relative"
          style={{
            gridTemplateColumns: "clamp(30px, 3.5vw, 46px) 1fr",
            height: "clamp(26px,3vh,40px)"
          }}
        >
          {menuOpen && (
            <div className="absolute bottom-[clamp(26px,3vh,40px)] left-0 w-[260px] bg-neutral-900 border border-neutral-800 p-4 z-50">
              <AuthButton />
            </div>
          )}

          {/* BOTTOM LEFT BUTTON (HAMBURGER HERE) */}
          <button
            onClick={() => setMenuOpen(prev => !prev)}
            className="border-r border-neutral-800 bg-neutral-950 hover:bg-neutral-900 flex items-center justify-center"
          >
            <div className="w-[60%] flex flex-col gap-[2px]">
              <div className="h-[2px] w-full bg-neutral-400" />
              <div className="h-[2px] w-full bg-neutral-400" />
              <div className="h-[2px] w-full bg-neutral-400" />
            </div>
          </button>

          {/* RIGHT SIDE CONTENT */}
          <div className="bg-neutral-900 flex items-center px-2">
            <div className="text-[clamp(10px,1.8vh,22px)] font-semibold leading-none">
              FXHEDZ
            </div>

            <div className="ml-auto text-right flex flex-col items-end">
              <div className="text-[clamp(7px,0.9vh,12px)] leading-[11px]">
                ZEROLOSS COMPOUNDED
              </div>
              <div className="text-[clamp(8px,1vh,14px)] text-neutral-500 leading-[11px] tracking-[0.1em]">
                HEDGING SYSTEM
              </div>
            </div>
          </div>

        </div>

      </main>

{!isAuthorized && (
  <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-50">
    <div className="bg-neutral-900/70 backdrop-blur-xl border border-neutral-700 shadow-2xl p-8 rounded-xl text-center space-y-4 max-w-sm">

      <div className="text-[10px] text-neutral-600 uppercase tracking-widest">
        LIVE ENGINE RUNNING
      </div>

      <div className="text-xl font-bold">
        FXHEDZ LIVE
      </div>

      {!session && (
        <>
          <div className="text-neutral-400 text-sm">
            Login to access institutional signal intelligence.
          </div>
          <AuthButton />
        </>
      )}

      {session && subActive === null && (
        <div className="text-neutral-400 text-sm">
          Verifying access...
        </div>
      )}

      {session && subActive === false && (
        <>
          <div className="text-neutral-400 text-sm">
            Subscription expired.
          </div>
          <a
            href="https://t.me/yourbot"
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-sm rounded-md"
          >
            Renew Subscription
          </a>
        </>
      )}

      <div className="text-xs text-neutral-500">
        9 Instruments · Live Orders · Full History
      </div>

    </div>
  </div>
)}

    </div>
  )
}

