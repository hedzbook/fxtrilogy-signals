"use client"

import React, { useEffect, useState, useMemo } from "react"
import PairCard from "@/components/PairCard"
import AccountStrip from "@/components/AccountStrip"
import VerticalSymbolButton from "@/components/VerticalSymbolButton"
import PairDetail from "@/components/PairDetail"
import AuthButton from "@/components/AuthButton"
import { useSession } from "next-auth/react"
import AccessOverlay from "@/components/AccessOverlay"

function generateDummySignals() {
  const base = {
    direction: "SELL",
    entry: 2345.50,
    sl: 2360.00,
    tp: 2320.00,
    price: 2342.10,
    lots: 2.40,
    buys: 0,
    sells: 3,
    orders: [
      {
        id: "d1",
        direction: "SELL",
        entry: 2345.50,
        lots: 0.80,
        profit: -12.30,
        time: "12:21:05"
      },
      {
        id: "d2",
        direction: "SELL",
        entry: 2348.20,
        lots: 0.80,
        profit: -5.40,
        time: "12:25:14"
      },
      {
        id: "d3",
        direction: "SELL",
        entry: 2350.10,
        lots: 0.80,
        profit: 3.10,
        time: "12:30:41"
      }
    ]
  }

  const pairs: any = {}

  const PAIRS = [
    "XAUUSD","BTCUSD","ETHUSD","EURUSD",
    "GBPUSD","USDJPY","AUDUSD","USDCHF","USOIL"
  ]

  PAIRS.forEach(p => {
    pairs[p] = {
      ...base,
      entry: base.entry + Math.random() * 50,
      price: base.price + Math.random() * 30
    }
  })

  return pairs
}

async function sha256(text: string) {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hash = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("")
}

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
  const [openPair, setOpenPair] = useState<string | null>(null)
  const [uiSignals, setUiSignals] = useState<any>({})
  const [netState, setNetState] = useState("FLAT")
  const [menuOpen, setMenuOpen] = useState(false)
  const [subActive, setSubActive] = useState<boolean | null>(null)
  const { data: session } = useSession()
  const [fingerprint, setFingerprint] = useState<string>("")
  const [accessMeta, setAccessMeta] = useState<any>(null)

  useEffect(() => {
  console.log("SESSION:", session)
  console.log("FINGERPRINT:", fingerprint)
  console.log("SUBACTIVE:", subActive)
}, [session, fingerprint, subActive])

useEffect(() => {

  async function generateFingerprint() {

    try {

      const raw = [
        navigator.userAgent,
        screen.width,
        screen.height,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        navigator.language
      ].join("|")

      let hash = ""

      if (window.crypto?.subtle) {
        const encoder = new TextEncoder()
        const data = encoder.encode(raw)
        const buffer = await window.crypto.subtle.digest("SHA-256", data)
        hash = Array.from(new Uint8Array(buffer))
          .map(b => b.toString(16).padStart(2, "0"))
          .join("")
      } else {
        hash = btoa(raw).slice(0, 64)
      }

      setFingerprint(hash)

    } catch {
      setFingerprint("fallback_" + Date.now())
    }
  }

  generateFingerprint()

}, [])

useEffect(() => {

// If not logged in → show dummy
if (!session) {
  setSignals(generateDummySignals())
  return
}

// If logged in but not active → no real signals
if (subActive !== true) {
  setSignals(generateDummySignals())
  return
}
    if (!fingerprint) return

    async function loadSignals() {
      try {

        const res = await fetch(
          `${SIGNAL_API}?fingerprint=${encodeURIComponent(fingerprint)}`
        )
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

  }, [subActive, fingerprint, session])

// =============================
// CHECK SUBSCRIPTION STATUS
// =============================
useEffect(() => {

  // NOT logged in → no verification
  if (!session) {
    setSubActive(false)
    return
  }

  // Wait until fingerprint exists
  if (!fingerprint) {
    return
  }

  async function init() {

    let id = localStorage.getItem("fxhedz_device_id")

    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem("fxhedz_device_id", id)
    }

    document.cookie = `fx_device=${id}; path=/; max-age=31536000`
    document.cookie = `fx_fp=${fingerprint}; path=/; max-age=31536000`

    try {
      const res = await fetch(
        `/api/subscription?fingerprint=${encodeURIComponent(fingerprint)}`,
        { cache: "no-store" }
      )

      const data = await res.json()

      // 🔥 CRITICAL LINE
      setSubActive(Boolean(data?.active))
      setAccessMeta(data)

    } catch {
      setSubActive(false)
    }
  }

  init()

}, [fingerprint, session])

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

    if (!openPair || subActive !== true) return
    if (!fingerprint) return

    const pairKey = openPair
    let cancelled = false

    async function refreshOpenPair() {
      try {

        const res = await fetch(
          `/api/signals?pair=${pairKey}&fingerprint=${encodeURIComponent(fingerprint)}`
        )
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
  }, [openPair, subActive, fingerprint])

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

  return (
    <div className="relative">

      <main
        className={`h-[100dvh] bg-black text-white flex flex-col ${session && subActive === false ? "pointer-events-none" : ""
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
<AccessOverlay
  active={subActive}
  sessionExists={!!session}
  status={accessMeta?.status}
  expiry={accessMeta?.expiry}
  blocked={accessMeta?.blocked}
/>
    </div>
  )
}

