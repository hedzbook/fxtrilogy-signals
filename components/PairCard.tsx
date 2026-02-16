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
  orders
}: Props) {

  const dir: TradeDirection = direction ?? "--"
  const [liveDir, setLiveDir] = useState<TradeDirection>(dir)

  const isMin = viewMode === "MIN"
  const isMax = viewMode === "MAX"
  const expanded = isMax ? true : open

  useEffect(() => setLiveDir(dir), [dir])

  return (
    <div
      className={`border border-neutral-800 rounded-xl overflow-hidden transition-all duration-300
      ${liveDir === "EXIT"
          ? "bg-gradient-to-b from-neutral-900 to-neutral-950"
          : "bg-[linear-gradient(180deg,rgba(20,20,20,0.9),rgba(0,0,0,0.95))]"
        }`}
    >

      {/* ================= HEADER ================= */}
      <div className="p-4">

        {/* ====== MIN MODE (FINAL STRUCTURE) ====== */}
        {isMin && signal ? (
          <div className="flex items-center justify-between">

            {/* LEFT BLOCK */}
            <div className="flex flex-col">
              <div className="font-semibold text-sm">{pair}</div>
              <div className="text-neutral-400 text-[11px]">
                {signal?.lots ?? "-"} LOTS
              </div>
            </div>

            {/* CENTER STRIP */}
            <div className="flex-1 flex justify-center px-4">
              <div className="w-full max-w-[320px]">
                <InlineTradeStrip
                  signal={signal}
                  direction={liveDir}
                />
              </div>
            </div>

            {/* RIGHT BLOCK */}
            <div className="flex flex-col items-end">
              <div
                className={`font-bold text-sm ${liveDir === "BUY"
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
              <div className="text-[11px] font-semibold">
                <span className="text-green-400">{signal?.buys ?? 0}B</span>
                <span className="text-neutral-500 px-1">/</span>
                <span className="text-red-400">{signal?.sells ?? 0}S</span>
              </div>
            </div>

          </div>
        ) : (
          /* ===== MID / MAX HEADER ===== */
          <div className="flex justify-between items-center">
            <div className="font-semibold">{pair}</div>
            <div className="font-bold">{liveDir}</div>
          </div>
        )}

      </div>

    </div>
  )
}

/* =======================================================
   INLINE STRIP (MIN MODE — CLEAN + CONTAINED)
======================================================= */

function InlineTradeStrip({
  signal,
  direction
}: {
  signal: any
  direction?: TradeDirection
}) {

  if (!signal?.entry || direction === "EXIT") return null

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
    <div className="flex flex-col items-center">

{/* LABELS — perfectly aligned to anchors */}
<div className="relative w-full h-[10px] text-[8px] text-neutral-400 mb-1">

  <span className="absolute left-0">
    SL/HEDZ
  </span>

  <span
    className="absolute left-1/2 -translate-x-1/2"
  >
    ENTRY
  </span>

  <span className="absolute right-0">
    TP
  </span>

</div>

      {/* BAR CONTAINER */}
      <div className="relative w-full h-[2px]">

        {/* Base line */}
        <div className="absolute inset-0 bg-neutral-800 rounded-full" />

        {/* Left Red */}
        <div
          className="absolute left-0 h-[2px] w-1/2"
          style={{
            background:
              "linear-gradient(90deg, rgba(248,113,113,0.9), rgba(239,68,68,0.1))"
          }}
        />

        {/* Right Green */}
        <div
          className="absolute right-0 h-[2px] w-1/2"
          style={{
            background:
              "linear-gradient(90deg, rgba(34,197,94,0.1), rgba(74,222,128,0.9))"
          }}
        />

        {/* FIXED ANCHOR CIRCLES */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-neutral-500 bg-black" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-neutral-500 bg-black" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-neutral-500 bg-black" />

        {/* GLOW DOT */}
        <div
          className="absolute top-1/2"
          style={{
            left: `${pricePercent}%`,
            transform: "translate(-50%, -50%)",
            transition: "left 300ms ease"
          }}
        >
          <div
            className={`absolute -inset-2 rounded-full blur-md ${
              isTPside ? "bg-green-500/30" : "bg-red-500/30"
            }`}
          />
          <div
            className={`w-2 h-2 rounded-full ${
              isTPside ? "bg-green-400" : "bg-red-400"
            }`}
            style={{
              boxShadow: isTPside
                ? "0 0 8px rgba(74,222,128,0.9)"
                : "0 0 8px rgba(248,113,113,0.9)"
            }}
          />
        </div>

      </div>

      {/* PRICES */}
      <div className="w-full flex justify-between text-[8px] text-neutral-400 mt-1">
        <span>{sl}</span>
        <span>{entry}</span>
        <span>{tp}</span>
      </div>

    </div>
  )
}


export default React.memo(PairCard)
