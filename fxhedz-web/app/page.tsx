"use client"

import React, { useEffect, useState, useMemo, useRef } from "react"
import PairCard from "@/components/PairCard"
import AccountStrip from "@/components/AccountStrip"
import VerticalSymbolButton from "@/components/VerticalSymbolButton"
import PairDetail from "@/components/PairDetail"
import AuthButton from "@/components/AuthButton"
import { useSession } from "next-auth/react"
import AccessOverlay from "@/components/AccessOverlay"
import { generateDummySignals } from "@/lib/dummySignals"
import { ensureDeviceIdentity } from "@/lib/device"

const pairs: any = {}

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
  const { data: session, status } = useSession()
  const [fingerprint, setFingerprint] = useState<string>("")
  const [accessMeta, setAccessMeta] = useState<any>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const hamburgerRef = useRef<HTMLButtonElement | null>(null)
  const daysLeft = useMemo(() => {

    if (!accessMeta?.expiry) return null

    const now = new Date()
    const expiry = new Date(accessMeta.expiry)

    const diff = expiry.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

    return days > 0 ? days : 0
  }, [accessMeta])

  useEffect(() => {

    function handleClickOutside(event: MouseEvent) {

      if (!menuOpen) return

      const target = event.target as Node

      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        hamburgerRef.current &&
        !hamburgerRef.current.contains(target)
      ) {
        setMenuOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }

  }, [menuOpen])

  useEffect(() => {
    console.log("SESSION:", session)
    console.log("FINGERPRINT:", fingerprint)
    console.log("SUBACTIVE:", subActive)
  }, [session, fingerprint, subActive])

  useEffect(() => {
    setAccessMeta(null)
    setSubActive(null)
  }, [session])

  useEffect(() => {
    const result = ensureDeviceIdentity()
    if (result?.fingerprint) {
      setFingerprint(result.fingerprint)
    }
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

      const params = new URLSearchParams(window.location.search)

      const urlPlatform = params.get("platform")
      const urlDeviceId = params.get("device_id")

      // Determine platform
      let platform = "web"

      if (urlPlatform === "android") {
        platform = "android"
      }

      // Telegram override
      try {
        const tg = (window as any)?.Telegram?.WebApp
        if (tg?.initDataUnsafe?.user?.id) {
          platform = "telegram"
          const tgUser = tg.initDataUnsafe.user
          document.cookie = `fx_tg_id=${tgUser.id}; path=/; max-age=31536000`
        }
      } catch { }

      // Determine device ID
      let id = urlDeviceId || localStorage.getItem("fxhedz_device_id")

      if (!id) {
        id = crypto.randomUUID()
        localStorage.setItem("fxhedz_device_id", id)
      }

      document.cookie = `fx_device=${id}; path=/; max-age=31536000`
      document.cookie = `fx_fp=${fingerprint}; path=/; max-age=31536000`
      document.cookie = `fx_platform=${platform}; path=/; max-age=31536000`

      // 🔥 PLATFORM DETECTION
      try {
        const tg = (window as any)?.Telegram?.WebApp

        if (tg?.initDataUnsafe?.user?.id) {
          const tgUser = tg.initDataUnsafe.user

          document.cookie = `fx_platform=telegram; path=/; max-age=31536000`
          document.cookie = `fx_tg_id=${tgUser.id}; path=/; max-age=31536000`
        } else {
          document.cookie = `fx_platform=web; path=/; max-age=31536000`
        }
      } catch {
        document.cookie = `fx_platform=web; path=/; max-age=31536000`
      }

      try {
        const res = await fetch(
          `/api/subscription?fingerprint=${encodeURIComponent(fingerprint)}`,
          { cache: "no-store" }
        )

        const data = await res.json()

        if (data?.blocked && data?.reason === "device_limit_exceeded") {
          setSubActive(false)
          setAccessMeta({
            ...data,
            deviceLimit: true
          })
          return
        }

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
            className="
    border-r border-neutral-800
    bg-neutral-950
    hover:bg-neutral-900
    flex items-center justify-center
  "
          >
            <img
              src="/favicon.png"
              alt="FXHEDZ"
              className="
      w-[90%]
      h-[90%]
      object-contain
      select-none
      pointer-events-none
    "
            />
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
            <div
              ref={menuRef}
              className="
      absolute
      bottom-[clamp(26px,3vh,40px)]
      left-0
      w-[260px]
      bg-neutral-900
      border border-neutral-800
      p-4
      z-50
      shadow-lg
      space-y-4
      text-[12px]
    "
            >

              {/* SUBSCRIPTION STATUS */}
              {session && (
                <div className="space-y-2 text-neutral-400">

                  <div className="flex justify-between">
                    <span>Plan</span>
                    <span className={subActive ? "text-green-400 font-semibold" : "text-red-400 font-semibold"}>
                      {subActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>

                  {daysLeft !== null && (
                    <div className="flex justify-between">
                      <span>Days Left</span>
                      <span className={daysLeft > 3 ? "text-sky-400 font-semibold" : "text-orange-400 font-semibold"}>
                        {daysLeft}
                      </span>
                    </div>
                  )}

                </div>
              )}

              <div className="border-t border-neutral-800 pt-3 space-y-3">

                {/* VERSION */}
                <div className="flex justify-between text-neutral-500">
                  <span>Version</span>
                  <span className="font-mono text-neutral-400">v0.1.0</span>
                </div>

                {/* UPGRADE */}
                <a
                  href="https://t.me/fxhedzbot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
          block w-full text-center
          py-2 rounded-md
          bg-sky-600 hover:bg-sky-500
          text-white font-semibold
          transition-colors
        "
                >
                  LIVE+
                </a>

                {/* SUPPORT */}
                <a
                  href="https://t.me/fxhedzbot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
          block w-full text-center
          py-2 rounded-md
          bg-neutral-800 hover:bg-neutral-700
          text-white font-semibold
          transition-colors
        "
                >
                  HELP
                </a>

                {/* AUTH BUTTON */}
                <div className="border-t border-neutral-800 pt-3">
                  <AuthButton />
                </div>

              </div>

            </div>
          )}

          {/* BOTTOM LEFT BUTTON (HAMBURGER HERE) */}
          <button
            ref={hamburgerRef}
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
      {status !== "loading" && (
        <AccessOverlay
          active={subActive}
          sessionExists={!!session}
          status={accessMeta?.status}
          expiry={accessMeta?.expiry}
          blocked={accessMeta?.blocked}
        />
      )}
    </div>
  )
}

