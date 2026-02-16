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
  const [pnlCache, setPnlCache] = useState<Record<string, number>>({})

  const isMin = viewMode === "MIN"
  const isMax = viewMode === "MAX"
  const expanded = isMax ? true : open

  useEffect(() => setLiveDir(dir), [dir])
  useEffect(() => setLiveOrders(orders ?? []), [orders])
  useEffect(() => { if (expanded) setTab("market") }, [expanded])

  useEffect(() => {
    if (!signal) return
    if (dir === "HEDGED") return

    const price = Number(signal?.price)
    const tp = Number(signal?.tp)
    const sl = Number(signal?.sl)

    if (!price || !tp || !sl) return

    if (liveDir === "BUY") {
      if (price >= tp || price <= sl) setLiveDir("EXIT")
    }

    if (liveDir === "SELL") {
      if (price <= tp || price >= sl) setLiveDir("EXIT")
    }

  }, [signal?.price, dir, liveDir])

  useEffect(() => {
    if (liveDir === "EXIT") setLiveOrders([])
  }, [liveDir])

  return (
    <div
      className={`
        border border-neutral-800 rounded-xl overflow-hidden transition-all duration-300
        ${isMin ? "h-full flex flex-col justify-center" : ""}
        ${liveDir === "EXIT"
          ? "bg-gradient-to-b from-neutral-900 to-neutral-950 opacity-100 border-neutral-800/60"
          : "bg-[linear-gradient(180deg,rgba(20,20,20,0.9),rgba(0,0,0,0.95))]"
        }
      `}
    >

      <div
        className={`${isMin ? "p-2" : "p-4"} cursor-pointer`}
        onClick={(e) => {
          e.stopPropagation()
          if (!isMax) onToggle()
        }}
      >

        {isMin && signal ? (
          <div className="flex items-center justify-between">

            <div className="flex flex-col">
              <div className="font-semibold text-sm">{pair}</div>
              <div className="text-neutral-400 text-xs">
                {signal?.lots ?? "-"} LOTS
              </div>
            </div>

            <div className="flex-1 flex justify-center px-4">
              <div className="w-full max-w-[320px]">
                <InlineTradeStrip signal={signal} direction={liveDir} />
              </div>
            </div>

            <div className="flex flex-col items-end">
              <div className={`font-bold text-sm ${
                liveDir === "BUY"
                  ? "text-green-400"
                  : liveDir === "SELL"
                    ? "text-red-400"
                    : liveDir === "HEDGED"
                      ? "text-sky-400"
                      : "text-neutral-500"
              }`}>
                {liveDir}
              </div>

              <div className="text-xs font-semibold">
                <span className="text-green-400">{signal?.buys ?? 0}B</span>
                <span className="text-neutral-500 px-1">/</span>
                <span className="text-red-400">{signal?.sells ?? 0}S</span>
              </div>
            </div>

          </div>
        ) : (
          <div className="w-full">
            <div className="flex justify-between items-center">
              <div className="font-semibold">{pair}</div>
              <div className={`font-bold ${
                liveDir === "BUY"
                  ? "text-green-400"
                  : liveDir === "SELL"
                    ? "text-red-400"
                    : liveDir === "HEDGED"
                      ? "text-sky-400"
                      : "text-neutral-500"
              }`}>
                {liveDir}
              </div>
            </div>

            {signal && (
              <div className="flex justify-between items-center text-xs mt-1">
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

            {liveDir !== "EXIT" &&
              (liveDir === "HEDGED" || (signal?.entry && signal?.sl && signal?.tp)) && (
                <TradeBar signal={signal} direction={liveDir} />
              )}
          </div>
        )}

      </div>
    </div>
  )
}

/* ================= INLINE STRIP ================= */

function InlineTradeStrip({ signal, direction }: any) {

  if (!signal?.entry || direction === "EXIT") return null

  const sl = Number(signal?.sl)
  const tp = Number(signal?.tp)
  const entry = Number(signal?.entry)
  const price = Number(signal?.price || entry)

  if (!sl || !tp) return null

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
    direction === "BUY" ? price >= entry : price <= entry

  return (
    <div className="flex flex-col items-center">

      <div className="relative w-full h-4 text-[clamp(11px,1.1vw,14px)] text-neutral-400 mb-1">
        <span className="absolute left-0">SL/HEDZ</span>
        <span className="absolute left-1/2 -translate-x-1/2">ENTRY</span>
        <span className="absolute right-0">TP</span>
      </div>

      <div className="relative w-full h-[3px]">
        <div className="absolute inset-0 bg-neutral-800 rounded-full" />
        <div className="absolute left-0 h-full w-1/2 bg-red-500/70" />
        <div className="absolute right-0 h-full w-1/2 bg-green-500/70" />

        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[10px] h-[10px] rounded-full border border-neutral-500 bg-black" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] rounded-full border border-neutral-500 bg-black" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[10px] h-[10px] rounded-full border border-neutral-500 bg-black" />

        <div
          className="absolute top-1/2"
          style={{
            left: `${pricePercent}%`,
            transform: "translate(-50%, -50%)"
          }}
        >
          <div className={`w-[10px] h-[10px] rounded-full ${
            isTPside ? "bg-green-400" : "bg-red-400"
          }`} />
        </div>
      </div>

      <div className="w-full flex justify-between text-[clamp(11px,1.1vw,14px)] text-neutral-400 mt-1">
        <span>{sl}</span>
        <span>{entry}</span>
        <span>{tp}</span>
      </div>

    </div>
  )
}

/* ================= TRADE BAR ================= */

function TradeBar({ signal, direction }: any) {

  const sl = Number(signal?.sl)
  const tp = Number(signal?.tp)
  const entry = Number(signal?.entry)
  const price = Number(signal?.price || entry)

  if (!sl || !tp || !entry) return null

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
    direction === "BUY" ? price >= entry : price <= entry

  return (
    <div className="mt-3 select-none">

      <div className="relative h-5 text-[clamp(12px,1.2vw,16px)] text-neutral-400 mb-1">
        <span className="absolute left-0">SL / HEDZ</span>
        <span className="absolute left-1/2 -translate-x-1/2">ENTRY</span>
        <span className="absolute right-0">TP</span>
      </div>

      <div className="relative h-[6px]">
        <div className="absolute left-0 h-full w-1/2 bg-red-500/70" />
        <div className="absolute right-0 h-full w-1/2 bg-green-500/70" />

        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[12px] h-[12px] rounded-full border border-neutral-400" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[12px] h-[12px] rounded-full border border-neutral-400" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[12px] h-[12px] rounded-full border border-neutral-400" />

        <div
          className="absolute top-1/2"
          style={{
            left: `${pricePercent}%`,
            transform: "translate(-50%, -50%)"
          }}
        >
          <div className={`w-[12px] h-[12px] rounded-full ${
            isTPside ? "bg-green-400" : "bg-red-400"
          }`} />
        </div>
      </div>

      <div className="flex justify-between text-[clamp(12px,1.2vw,16px)] text-neutral-400 mt-1">
        <span>{sl}</span>
        <span>{entry}</span>
        <span>{tp}</span>
      </div>

    </div>
  )
}

export default React.memo(PairCard)
