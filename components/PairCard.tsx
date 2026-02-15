// components/PairCard.tsx

"use client"

import React from "react"
import { useState, useEffect } from "react"
import GlobalLightChart from "./GlobalLightChart"

type TradeDirection = "BUY" | "SELL" | "HEDGED" | "EXIT" | "--"

type Props = {
  pair: string
  open?: boolean
  direction?: TradeDirection
  signal?: any
  history?: any[]
  orders?: any[]
  performance?: any
  notes?: string
  onToggle: () => void
}

function PairCard({
  pair,
  open,
  onToggle,
  direction,
  signal,
  history,
  orders,
  performance,
  notes
}: Props) {

  const dir: TradeDirection = direction ?? "--"
  const [liveDir, setLiveDir] = useState<TradeDirection>(dir)
  const [tab, setTab] = useState<"market" | "news" | "history" | "performance">("market")
  const [liveOrders, setLiveOrders] = useState<any[]>(orders ?? [])
  const [pnlCache, setPnlCache] = useState<Record<string, number>>({})

  useEffect(() => {
    if (open) setTab("market")
  }, [open])

  useEffect(() => {
    setLiveDir(dir)
  }, [dir])

  useEffect(() => {

    if (!signal) return
    if (dir === "HEDGED") return

    const price = Number(signal?.price)
    const tp = Number(signal?.tp)
    const sl = Number(signal?.sl)

    if (!price || !tp || !sl) return

    if (liveDir === "BUY") {
      if (price >= tp || price <= sl) {
        setLiveDir("EXIT")
      }
    }

    if (liveDir === "SELL") {
      if (price <= tp || price >= sl) {
        setLiveDir("EXIT")
      }
    }

  }, [signal?.price, dir, liveDir])

  useEffect(() => {
    setLiveOrders(orders ?? [])
  }, [orders])

  useEffect(() => {
    // 🔥 HARD SYNC WITH TRADE STATE
    if (liveDir === "EXIT") {
      setLiveOrders([])
    }
  }, [liveDir])

  return (
    <div
      className={`border border-neutral-800 rounded-xl overflow-hidden transition-all active:scale-[0.99]
${liveDir === "EXIT"
          ? "bg-gradient-to-b from-neutral-900 to-neutral-950 opacity-100 border-neutral-800/60"
          : "bg-[linear-gradient(180deg,rgba(20,20,20,0.9),rgba(0,0,0,0.95))]"}
`}
    >
      {/* HEADER */}
      <div
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        className="p-4 cursor-pointer"
      >
        <div className="w-full">

          <div className="flex justify-between items-center">
            <div className="font-semibold">{pair}</div>

            <div
              className={`font-bold ${liveDir === "BUY"
                ? "text-green-400"
                : liveDir === "SELL"
                  ? "text-red-400"
                  : liveDir === "HEDGED"
                    ? "text-sky-400"
                    : "text-neutral-500"}`}
            >
              {liveDir}
            </div>
          </div>
          {/* 🔥 EXPOSURE ROW */}
          {signal && (
            <div className="flex justify-between items-center text-[11px] mt-1">
              <div className="text-neutral-400 font-semibold tracking-widest">
                {(signal?.lots ?? "--")} LOTS
              </div>

              <div className="font-semibold tracking-wide">
                <span className="text-green-400">{signal?.buys ?? 0}B</span>
                <span className="text-neutral-500 px-1">/</span>
                <span className="text-red-400">{signal?.sells ?? 0}S</span>
              </div>
            </div>
          )}

          {/* 🔥 TRADE BAR ONLY FOR ACTIVE TRADES */}
          {liveDir !== "EXIT" &&
            (liveDir === "HEDGED" || (signal?.entry && signal?.sl && signal?.tp)) && (
              <TradeBar signal={signal} direction={liveDir} />
            )}

        </div>
      </div>

      {open && (
        <div className="border-t border-neutral-800 p-0">

          {/* ======================= HORIZONTAL MENU ======================== */}
          <div className="flex w-full border-b border-neutral-800 text-sm">

            <TabBtn label="Market" active={tab === "market"} onClick={() => setTab("market")} />
            <TabBtn label="News" active={tab === "news"} onClick={() => setTab("news")} />
            <TabBtn label="History" active={tab === "history"} onClick={() => setTab("history")} />
            <TabBtn label="Performance" active={tab === "performance"} onClick={() => setTab("performance")} />

          </div>

          {/* ======================= TAB CONTENT AREA 🔑 FIXED HEIGHT + SCROLL ======================== */}
          <div className="h-[75dvh] overflow-y-auto overscroll-contain touch-pan-y p-4 space-y-4">

            {/* 🔥 GLOBAL CHART MOUNT POINT (ALWAYS MOUNTED — NEVER REMOVE) */}
            <div
              id={`chart_mount_${pair}`}
              className={`w-full h-[280px] rounded-lg bg-neutral-900 ${tab === "market" ? "block" : "hidden"
                }`}
            />
            {tab === "market" && (
              <GlobalLightChart
                mountId={`chart_mount_${pair}`}
                signal={signal}
              />
            )}

            {/* ======================= MARKET TAB CONTENT ======================= */}
            <div className={`${tab === "market" ? "block" : "hidden"} -mt-2 space-y-3`}>

              <div>
                <div className="text-sm text-neutral-400">Latest Signal</div>
                <div className="font-bold text-lg">
                  {signal?.direction || "--"} {signal?.entry || ""}
                </div>
                <div className="text-sm text-neutral-400">
                  SL {signal?.sl || "--"} · TP {signal?.tp || "--"}
                </div>
              </div>

              {/* MARKET NOTES */}
              <div className="bg-neutral-800 rounded-lg p-2 text-sm text-neutral-300">
                {/* ACTIVE ORDERS */}
                <div>
                  <div className="text-sm text-neutral-400 mb-2">Active Orders</div>

                  <div className="max-h-[200px] overflow-y-auto space-y-1 pr-1">
                    {liveOrders?.length ? liveOrders.map((o, i) => {

                      const key = o.id || `${o.direction}_${o.entry}_${o.time}`
                      const pnl = Number(o.profit ?? 0)
                      const prev = pnlCache[key] ?? pnl

                      const pnlColor =
                        pnl > 0
                          ? "text-green-400"
                          : pnl < 0
                            ? "text-red-400"
                            : "text-neutral-400"

                      let pulseClass = ""
                      if (pnl > prev) pulseClass = "ring-1 ring-green-400/40"
                      if (pnl < prev) pulseClass = "ring-1 ring-red-400/40"

                      return (
                        <div
                          key={key}
                          className={`bg-neutral-800 p-2 rounded-md text-xs flex justify-between transition-all duration-300 ${pulseClass}`}
                        >

                          <div className="space-y-1">
                            <div className="flex gap-2 items-center">
                              <span className={`font-semibold ${o.direction === "BUY"
                                ? "text-green-400"
                                : o.direction === "SELL"
                                  ? "text-red-400"
                                  : "text-sky-400"
                                }`}>
                                {o.hedged ? `${o.direction} (HEDGED)` : o.direction}
                              </span>

                              <span className="text-neutral-500 text-xs">
                                {o.time}
                              </span>
                            </div>

                            <div className="text-neutral-400 text-xs">
                              ENTRY {o.entry}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-neutral-400 text-xs">
                              {o.lots ?? "--"}
                            </div>

                            <div className={`font-semibold ${pnlColor}`}>
                              {pnl.toFixed(2)}
                            </div>
                          </div>

                        </div>
                      )
                    }) : (
                      <div className="text-neutral-500 text-sm">No open orders</div>
                    )}
                  </div>
                </div>
              </div>

            </div>
            {tab === "news" && (
              <div className="space-y-3">

                <div className="text-sm text-neutral-400">
                  Market Commentary
                </div>

                <div className="bg-neutral-800 rounded-lg p-4 text-sm text-neutral-300 leading-relaxed">
                  {notes || "No market commentary available"}
                </div>

              </div>
            )}
            {tab === "history" && (
              <div className="space-y-2">
                {history?.length ? history.map((h, i) => (
                  <div key={i} className="bg-neutral-800 p-3 rounded-lg text-sm flex justify-between">
                    <div className="space-y-1">

                      <div className="flex gap-2 items-center">
                        <span className={`font-semibold ${h.direction === "BUY" ? "text-green-400" : "text-red-400"}`}>
                          {h.direction}
                        </span>

                        <span className="text-neutral-500 text-xs">
                          {h.time}
                        </span>
                      </div>

                      <div className="text-neutral-400 text-xs">
                        {h.entry} → {h.exit}
                      </div>

                    </div>
                    <div className={h.pnl >= 0 ? "text-green-400" : "text-red-400"}>
                      {h.pnl}
                    </div>
                  </div>
                )) : (
                  <div className="text-neutral-500 text-sm">No history yet</div>
                )}
              </div>
            )}

            {tab === "performance" && (
              <div className="space-y-4">

                {/* PRIMARY METRICS */}
                <div className="grid grid-cols-2 gap-3 text-sm">

                  <Metric
                    label="Win Rate"
                    value={performance?.winRate !== undefined ? performance.winRate + "%" : "--"}
                  />

                  <Metric
                    label="Profit Factor"
                    value={performance?.profitFactor ?? "--"}
                  />

                </div>

                {/* SECONDARY METRICS */}
                <div className="space-y-2 text-sm">

                  <Stat label="Total Trades" value={performance?.trades} />
                  <Stat label="Wins" value={performance?.wins} />
                  <Stat label="Losses" value={performance?.losses} />

                  <Stat
                    label="Total PnL"
                    value={performance?.pnlTotal}
                  />

                </div>

              </div>
            )}

          </div>

        </div>
      )}
    </div>
  )
}

/* ======================================================
   INSTITUTIONAL TRADE BAR
====================================================== */

function TradeBar({
  signal,
  direction
}: {
  signal: any
  direction?: "BUY" | "SELL" | "HEDGED" | "EXIT" | "--"
}) {

  const sl = Number(signal?.sl)
  const tp = Number(signal?.tp)
  const entry = Number(signal?.entry)
  const price = Number(signal?.price || entry)

  // 🚫 DO NOT RENDER ON EXIT STATE
  if (direction === "EXIT") return null

  if (!sl || !tp || !entry) return null

  // --- ENTRY-CENTERED COORDINATE SYSTEM

  const entryPercent = 50
  let pricePercent = 50

  if (direction === "BUY") {

    const leftRange = Math.abs(entry - sl)
    const rightRange = Math.abs(tp - entry)

    if (price < entry && leftRange > 0) {
      pricePercent = 50 - ((entry - price) / leftRange) * 50
    }

    if (price > entry && rightRange > 0) {
      pricePercent = 50 + ((price - entry) / rightRange) * 50
    }

  } else if (direction === "SELL") {

    // 🔥 FLIPPED AXIS FOR SELL
    const leftRange = Math.abs(tp - entry)
    const rightRange = Math.abs(entry - sl)

    if (price > entry && rightRange > 0) {
      pricePercent = 50 - ((price - entry) / rightRange) * 50
    }

    if (price < entry && leftRange > 0) {
      pricePercent = 50 + ((entry - price) / leftRange) * 50
    }
  }

  if (direction === "HEDGED") {
    return (
      <div className="mt-3 select-none">

        <div className="relative h-3 text-[10px] text-neutral-400 mb-1">
          <span className="absolute left-0 text-sky-400">HEDZ</span>
          <span
            className="absolute text-sky-400"
            style={{ left: "50%", transform: "translateX(-50%)" }}
          >
            ENTRY
          </span>
          <span className="absolute right-0 text-sky-400">HEDZ</span>
        </div>

        <div className="relative h-6 flex items-center">

          {/* BLUE LEFT */}
          <div
            className="absolute h-[2px] bg-sky-400/60"
            style={{ width: "50%" }}
          />

          {/* BLUE RIGHT */}
          <div
            className="absolute h-[2px] bg-sky-400/60"
            style={{ left: "50%", width: "50%" }}
          />

          {/* CENTER DOT */}
          <div
            className="absolute"
            style={{ left: "50%", transform: "translateX(-50%)" }}
          >
            <div className="absolute -inset-2 rounded-full blur-md bg-sky-400/30" />
            <div
              className="w-3 h-3 rounded-full bg-sky-400"
              style={{ boxShadow: "0 0 18px rgba(56,189,248,0.9)" }}
            />
          </div>

        </div>

        <div className="flex justify-between text-[11px] text-sky-400 mt-1">
          <span>{signal?.entry}</span>
          <span>{signal?.entry}</span>
          <span>{signal?.entry}</span>
        </div>

      </div>
    )
  }

  // clamp
  pricePercent = Math.max(0, Math.min(100, pricePercent))

  pricePercent = Math.max(0, Math.min(100, pricePercent))

  const isTPside =
    direction === "BUY"
      ? price >= entry
      : price <= entry

  return (
    <div className="mt-3 select-none">

      {/* 🔥 PERFECTLY ALIGNED LABELS */}
      <div className="relative h-3 text-[10px] text-neutral-400 mb-1">

        <span className="absolute left-0">SL / HEDZ</span>

        <span
          className="absolute"
          style={{
            left: `${entryPercent}%`,
            transform: "translateX(-50%)"
          }}
        >
          ENTRY
        </span>

        <span className="absolute right-0">TP</span>
      </div>

      <div className="relative h-6 flex items-center overflow-visible">

        {/* 🔴 LEFT RED ZONE */}
        <div
          className="absolute h-[2px]"
          style={{
            width: `${entryPercent}%`,
            background:
              "linear-gradient(90deg, rgba(248,113,113,0.8), rgba(239,68,68,0.05))"
          }}
        />

        {/* 🟢 RIGHT GREEN ZONE */}
        <div
          className="absolute h-[2px]"
          style={{
            left: `${entryPercent}%`,
            width: `${100 - entryPercent}%`,
            background:
              "linear-gradient(90deg, rgba(34,197,94,0.05), rgba(74,222,128,0.8))"
          }}
        />

        {/* FIXED HOLLOW DOTS */}
        <div className="absolute left-0 w-3 h-3 rounded-full border border-neutral-400" />

        <div
          className="absolute w-3 h-3 rounded-full border border-neutral-400"
          style={{
            left: `${entryPercent}%`,
            transform: "translateX(-50%)"
          }}
        />

        <div className="absolute right-0 w-3 h-3 rounded-full border border-neutral-400" />

        {/* 🔥 LIVE PRICE DOT (ONLY BUY/SELL) */}
        <div
          className="absolute"
          style={{
            left: `${pricePercent}%`,
            transform: "translateX(-50%)",
            transition: "left 380ms cubic-bezier(0.22,1,0.36,1)",
            willChange: "left"
          }}
        >
          <div
            className={`absolute -inset-2 rounded-full blur-md ${isTPside ? "bg-green-500/30" : "bg-red-500/30"
              }`}
          />

          <div
            className={`w-3 h-3 rounded-full ${isTPside ? "bg-green-400" : "bg-red-400"
              }`}
            style={{
              boxShadow: isTPside
                ? "0 0 18px rgba(74,222,128,0.9)"
                : "0 0 18px rgba(248,113,113,0.9)",
              animation: "instPulse 1.6s cubic-bezier(0.4,0,0.2,1) infinite"
            }}
          />
        </div>

      </div>

      {/* PRICES */}
      <div className="flex justify-between text-[11px] text-neutral-400 mt-1">
        <span>{signal?.sl}</span>
        <span>{signal?.entry}</span>
        <span>{signal?.tp}</span>
      </div>

      <style jsx>{`
        @keyframes instPulse {
          0% { transform: scale(0.85); opacity:.7 }
          50% { transform: scale(1.25); opacity:1 }
          100% { transform: scale(0.85); opacity:.7 }
        }
      `}</style>

    </div>
  )
}
function TabBtn({
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
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={`flex-1 py-3 text-center transition-all duration-200 ${active
        ? "text-white border-b-2 border-white bg-neutral-900"
        : "text-neutral-500 hover:text-neutral-300"
        }`}
    >
      {label}
    </button>
  )
}
function Stat({ label, value }: { label: string, value: any }) {
  return (
    <div className="flex justify-between bg-neutral-800 rounded-lg p-3">
      <span className="text-neutral-400">{label}</span>
      <span className="font-semibold">{value ?? "--"}</span>
    </div>
  )
}

function Metric({ label, value }: { label: string, value: any }) {
  return (
    <div className="bg-neutral-800 rounded-lg p-4 text-center">
      <div className="text-neutral-400 text-xs">{label}</div>
      <div className="text-xl font-bold">{value ?? "--"}</div>
    </div>
  )
}

export default React.memo(PairCard)
