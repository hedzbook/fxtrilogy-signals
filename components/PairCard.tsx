// components/PairCard.tsx

"use client"

import React, { useState, useEffect } from "react"
import GlobalLightChart from "./GlobalLightChart"

type TradeDirection = "BUY" | "SELL" | "HEDGED" | "EXIT" | "--"
type ViewMode = "MIN" | "MID" | "MAX"

type Props = {
  pair: string
  open?: boolean
  viewMode?: ViewMode
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
  viewMode = "MID",
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

  const isMin = viewMode === "MIN"
  const isMax = viewMode === "MAX"
  const expanded = isMax ? true : open

  useEffect(() => {
    if (expanded) setTab("market")
  }, [expanded])

  useEffect(() => {
    setLiveDir(dir)
  }, [dir])

  useEffect(() => {
    setLiveOrders(orders ?? [])
  }, [orders])

  return (
    <div
      className={`border border-neutral-800 rounded-xl overflow-hidden transition-all duration-300
        ${liveDir === "EXIT"
          ? "bg-gradient-to-b from-neutral-900 to-neutral-950"
          : "bg-[linear-gradient(180deg,rgba(20,20,20,0.9),rgba(0,0,0,0.95))]"
        }`}
    >

      {/* ================= HEADER ================= */}
      <div
        onClick={(e) => {
          e.stopPropagation()
          if (!isMax && !isMin) onToggle()
        }}
        className="p-4 cursor-pointer"
      >
        <div className="flex justify-between items-center">
          <div className="font-semibold">{pair}</div>

          <div
            className={`font-bold ${liveDir === "BUY"
              ? "text-green-400"
              : liveDir === "SELL"
                ? "text-red-400"
                : liveDir === "HEDGED"
                  ? "text-sky-400"
                  : "text-neutral-500"
              }`}
          >
            {liveDir}
          </div>
        </div>

{/* ================= MIN MODE STRUCTURE ================= */}
{signal && isMin && (
  <div className="mt-2 flex items-center gap-3 text-[11px]">

    {/* LEFT LOTS */}
    <div className="text-neutral-400 font-semibold whitespace-nowrap">
      {signal?.lots ?? "-"} LOTS
    </div>

    {/* CENTER TRADE STRIP */}
    <div className="flex-1">
      {liveDir !== "EXIT" &&
        (liveDir === "HEDGED" || (signal?.entry && signal?.sl && signal?.tp)) && (
          <InlineTradeStrip
            signal={signal}
            direction={liveDir}
          />
        )}
    </div>

    {/* RIGHT B/S */}
    <div className="font-semibold whitespace-nowrap">
      <span className="text-green-400">{signal?.buys ?? 0}B</span>
      <span className="text-neutral-500 px-1">/</span>
      <span className="text-red-400">{signal?.sells ?? 0}S</span>
    </div>

  </div>
)}

{/* TRADE VISUAL */}
{liveDir !== "EXIT" &&
  (liveDir === "HEDGED" || (signal?.entry && signal?.sl && signal?.tp)) && (
    isMin
      ? null // handled inside MIN structure
      : <TradeBar
          signal={signal}
          direction={liveDir}
          viewMode={viewMode}
        />
  )}

      </div>

      {/* ================= MIN MODE = HEADER ONLY ================= */}
      {isMin && null}

      {/* ================= EXPANDED AREA ================= */}
      {!isMin && expanded && (
        <div className="border-t border-neutral-800">

          {/* Tabs */}
          <div className="flex w-full border-b border-neutral-800 text-sm">
            <TabBtn label="Market" active={tab === "market"} onClick={() => setTab("market")} />
            <TabBtn label="News" active={tab === "news"} onClick={() => setTab("news")} />
            <TabBtn label="History" active={tab === "history"} onClick={() => setTab("history")} />
            <TabBtn label="Performance" active={tab === "performance"} onClick={() => setTab("performance")} />
          </div>

          <div className="h-[70dvh] overflow-y-auto p-4 space-y-4">

            {/* Chart Mount */}
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

            {/* Market Content */}
            {tab === "market" && (
              <div className="space-y-3">

                <div>
                  <div className="text-sm text-neutral-400">Latest Signal</div>
                  <div className="font-bold text-lg">
                    {signal?.direction || "--"} {signal?.entry || ""}
                  </div>
                  <div className="text-sm text-neutral-400">
                    SL {signal?.sl || "--"} · TP {signal?.tp || "--"}
                  </div>
                </div>

                <div className="bg-neutral-800 rounded-lg p-2 text-sm text-neutral-300">

                  <div className="text-sm text-neutral-400 mb-2">
                    Active Orders
                  </div>

                  <div className="max-h-[170px] overflow-y-auto space-y-1">
                    {liveOrders?.length ? liveOrders.map((o: any, i: number) => {

                      const pnl = Number(o.profit ?? 0)

                      return (
                        <div
                          key={o.id || i}
                          className="bg-neutral-900 p-2 rounded-md text-xs flex justify-between"
                        >

                          <div>
                            <div className={`font-semibold ${o.direction === "BUY"
                              ? "text-green-400"
                              : "text-red-400"
                              }`}>
                              {o.direction}
                            </div>

                            <div className="text-neutral-400">
                              ENTRY {o.entry}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-neutral-400">
                              {o.lots}
                            </div>

                            <div className={pnl >= 0 ? "text-green-400" : "text-red-400"}>
                              {pnl.toFixed(2)}
                            </div>
                          </div>

                        </div>
                      )

                    }) : (
                      <div className="text-neutral-500 text-sm">
                        No open orders
                      </div>
                    )}
                  </div>

                </div>

              </div>
            )}

          </div>
        </div>
      )}
    </div>
  )
}

function InlineTradeStrip({
  signal,
  direction
}: {
  signal: any
  direction?: TradeDirection
}) {

  if (!signal?.entry) return null
  if (direction === "EXIT") return null

  const sl = Number(signal?.sl)
  const tp = Number(signal?.tp)
  const entry = Number(signal?.entry)
  const price = Number(signal?.price || entry)

  if (!sl || !tp) return null

  const entryPercent = 50
  let pricePercent = 50

  if (direction === "BUY") {
    const leftRange = Math.abs(entry - sl)
    const rightRange = Math.abs(tp - entry)

    if (price < entry && leftRange > 0)
      pricePercent = 50 - ((entry - price) / leftRange) * 50

    if (price > entry && rightRange > 0)
      pricePercent = 50 + ((price - entry) / rightRange) * 50
  }

  if (direction === "SELL") {
    const leftRange = Math.abs(tp - entry)
    const rightRange = Math.abs(entry - sl)

    if (price > entry && rightRange > 0)
      pricePercent = 50 - ((price - entry) / rightRange) * 50

    if (price < entry && leftRange > 0)
      pricePercent = 50 + ((entry - price) / leftRange) * 50
  }

  pricePercent = Math.max(0, Math.min(100, pricePercent))

  const isTPside =
    direction === "BUY"
      ? price >= entry
      : price <= entry

  return (
    <div className="relative h-7 flex flex-col justify-center">

      {/* LABELS (tightened + raised) */}
      <div className="absolute top-[-8px] w-full text-[8px] text-neutral-400 flex justify-between">
        <span>SL/HEDZ</span>
        <span>ENTRY</span>
        <span>TP</span>
      </div>

      {/* BAR */}
      <div className="relative w-full h-[2px]">

        {/* LEFT RED */}
        <div
          className="absolute h-[2px]"
          style={{
            width: "50%",
            background:
              "linear-gradient(90deg, rgba(248,113,113,0.8), rgba(239,68,68,0.05))"
          }}
        />

        {/* RIGHT GREEN */}
        <div
          className="absolute h-[2px]"
          style={{
            left: "50%",
            width: "50%",
            background:
              "linear-gradient(90deg, rgba(34,197,94,0.05), rgba(74,222,128,0.8))"
          }}
        />

        {/* PRICE DOT */}
        <div
          className="absolute"
          style={{
            left: `${pricePercent}%`,
            transform: "translate(-50%, -40%)",
            transition: "left 350ms cubic-bezier(0.22,1,0.36,1)"
          }}
        >
          <div
            className={`absolute -inset-2 rounded-full blur-md ${
              isTPside ? "bg-green-500/30" : "bg-red-500/30"
            }`}
          />
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isTPside ? "bg-green-400" : "bg-red-400"
            }`}
            style={{
              boxShadow: isTPside
                ? "0 0 10px rgba(74,222,128,0.9)"
                : "0 0 10px rgba(248,113,113,0.9)",
              animation: "instPulse 1.6s ease-in-out infinite"
            }}
          />
        </div>

      </div>

      {/* PRICES (raised closer) */}
      <div className="absolute bottom-[-8px] w-full text-[8px] text-neutral-400 flex justify-between">
        <span>{sl}</span>
        <span>{entry}</span>
        <span>{tp}</span>
      </div>

      <style jsx>{`
        @keyframes instPulse {
          0% { transform: scale(0.85); opacity:.7 }
          50% { transform: scale(1.2); opacity:1 }
          100% { transform: scale(0.85); opacity:.7 }
        }
      `}</style>

    </div>
  )
}

/* ======================================================
   SIMPLIFIED TRADE BAR (NO MT5/GAS IMPACT)
====================================================== */

function TradeBar({
  signal,
  direction,
  viewMode
}: {
  signal: any
  direction?: TradeDirection
  viewMode?: ViewMode
}) {

  if (!signal?.entry) return null
  if (direction === "EXIT") return null

  const sl = Number(signal?.sl)
  const tp = Number(signal?.tp)
  const entry = Number(signal?.entry)
  const price = Number(signal?.price || entry)

  if (!entry) return null

  const isMin = viewMode === "MIN"

  // ==========================================
  // HEDGED MODE
  // ==========================================
  if (direction === "HEDGED") {

    return (
      <div className={`mt-2 select-none ${isMin ? "scale-[0.9]" : ""}`}>

        {!isMin && (
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
        )}

        <div className="relative h-4 flex items-center">

          <div className="absolute h-[2px] bg-sky-400/60 w-1/2" />
          <div className="absolute h-[2px] bg-sky-400/60 left-1/2 w-1/2" />

          <div
            className="absolute"
            style={{ left: "50%", transform: "translateX(-50%)" }}
          >
            <div className="absolute -inset-2 rounded-full blur-md bg-sky-400/30" />
            <div
              className="w-2.5 h-2.5 rounded-full bg-sky-400"
              style={{ boxShadow: "0 0 12px rgba(56,189,248,0.9)" }}
            />
          </div>
        </div>

        {!isMin && (
          <div className="flex justify-between text-[10px] text-sky-400 mt-1">
            <span>{entry}</span>
            <span>{entry}</span>
            <span>{entry}</span>
          </div>
        )}

      </div>
    )
  }

  if (!sl || !tp) return null

  // ==========================================
  // ENTRY-CENTERED AXIS
  // ==========================================

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

    const leftRange = Math.abs(tp - entry)
    const rightRange = Math.abs(entry - sl)

    if (price > entry && rightRange > 0) {
      pricePercent = 50 - ((price - entry) / rightRange) * 50
    }

    if (price < entry && leftRange > 0) {
      pricePercent = 50 + ((entry - price) / leftRange) * 50
    }
  }

  pricePercent = Math.max(0, Math.min(100, pricePercent))

  const isTPside =
    direction === "BUY"
      ? price >= entry
      : price <= entry

  return (
    <div className={`mt-2 select-none ${isMin ? "scale-[0.9]" : ""}`}>

      {!isMin && (
        <div className="relative h-3 text-[10px] text-neutral-400 mb-1">
          <span className="absolute left-0">SL / HEDZ</span>
          <span
            className="absolute"
            style={{ left: `${entryPercent}%`, transform: "translateX(-50%)" }}
          >
            ENTRY
          </span>
          <span className="absolute right-0">TP</span>
        </div>
      )}

      <div className="relative h-4 flex items-center overflow-visible">

        <div
          className="absolute h-[2px]"
          style={{
            width: `${entryPercent}%`,
            background:
              "linear-gradient(90deg, rgba(248,113,113,0.8), rgba(239,68,68,0.05))"
          }}
        />

        <div
          className="absolute h-[2px]"
          style={{
            left: `${entryPercent}%`,
            width: `${100 - entryPercent}%`,
            background:
              "linear-gradient(90deg, rgba(34,197,94,0.05), rgba(74,222,128,0.8))"
          }}
        />

        <div className="absolute left-0 w-2 h-2 rounded-full border border-neutral-500" />
        <div
          className="absolute w-2 h-2 rounded-full border border-neutral-500"
          style={{
            left: `${entryPercent}%`,
            transform: "translateX(-50%)"
          }}
        />
        <div className="absolute right-0 w-2 h-2 rounded-full border border-neutral-500" />

        <div
          className="absolute"
          style={{
            left: `${pricePercent}%`,
            transform: "translateX(-50%)",
            transition: "left 350ms cubic-bezier(0.22,1,0.36,1)"
          }}
        >
          <div
            className={`absolute -inset-2 rounded-full blur-md ${isTPside ? "bg-green-500/30" : "bg-red-500/30"
              }`}
          />

          <div
            className={`w-2.5 h-2.5 rounded-full ${isTPside ? "bg-green-400" : "bg-red-400"
              }`}
            style={{
              boxShadow: isTPside
                ? "0 0 14px rgba(74,222,128,0.9)"
                : "0 0 14px rgba(248,113,113,0.9)",
              animation: "instPulse 1.6s ease-in-out infinite"
            }}
          />
        </div>

      </div>

      {!isMin && (
        <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
          <span>{sl}</span>
          <span>{entry}</span>
          <span>{tp}</span>
        </div>
      )}

      <style jsx>{`
        @keyframes instPulse {
          0% { transform: scale(0.85); opacity:.7 }
          50% { transform: scale(1.2); opacity:1 }
          100% { transform: scale(0.85); opacity:.7 }
        }
      `}</style>

    </div>
  )
}

/* ====================================================== */

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

export default React.memo(PairCard)
