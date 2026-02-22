"use client"

import React, { useState, useEffect } from "react"
import GlobalLightChart from "./GlobalLightChart"

type TradeDirection = "BUY" | "SELL" | "HEDGED" | "EXIT" | "--"
type ViewMode = "MIN" | "MAX"

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
  viewMode = "MIN",
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
  const expanded = !!open

  useEffect(() => setLiveDir(dir), [dir])
  useEffect(() => setLiveOrders(orders ?? []), [orders])
  useEffect(() => { if (expanded) setTab("market") }, [expanded])
  useEffect(() => {
    const newCache: Record<string, number> = {}
    liveOrders.forEach(o => {
      const key = o.id || `${o.direction}_${o.entry}_${o.time}`
      newCache[key] = Number(o.profit ?? 0)
    })
    setPnlCache(newCache)
  }, [liveOrders])

  return (
    <div
      className={`
    text-[clamp(10px,1.1vw,20px)]
    relative
    transition-all duration-300
    border border-neutral-800 rounded-none
    overflow-hidden flex flex-col
    ${viewMode === "MIN" && !expanded ? "justify-center" : ""}
    flex-none
    ${expanded ? "z-20 shadow-xl" : "z-0"}
  `}
    >

      {/* ================= HEADER ================== */}
      <div
        className="
    flex-shrink-0
    flex flex-col
    justify-center
    px-3
py-[clamp(2px,0.6vh,6px)]
    cursor-pointer
  "
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
      >

        {signal && (
          <div className="flex flex-col w-full">

            {/* ROW 1 — PAIR + DIRECTION */}
            <div className="flex justify-between items-center">
              <div className="font-semibold text-[clamp(10px,1.8vh,22px)] leading-none">
                {pair}
              </div>

              <div className={`font-bold text-[clamp(10px,1.8vh,22px)] ${liveDir === "BUY"
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

            {/* ROW 2 — LOTS + B/S COUNT */}
            <div className="mt-[clamp(1px,0.4vw,6px)] flex justify-between items-center text-[clamp(8px,1.3vh,18px)] leading-none">
              <div className="text-neutral-400">
                {signal?.lots ?? "-"} LOTS
              </div>

              <div className="font-semibold">
                <span className="text-green-400">{signal?.buys ?? 0}B</span>
                <span className="text-neutral-500 px-1">/</span>
                <span className="text-red-400">{signal?.sells ?? 0}S</span>
              </div>
            </div>

            {/* ROW 3 — TRADE BAR */}
            <div className="mt-[clamp(1px,0.8vw,10px)]">
              <InlineTradeStrip
                signal={signal}
                direction={liveDir}
              />
            </div>

          </div>
        )}
      </div>

      {/* ================= EXPANDED CONTENT ================ */}
      {expanded && (
        <div className="border-t border-neutral-800 flex flex-col flex-1 min-h-0 overflow-y-auto">

          {/* TABS */}
          <div className="flex w-full border-b border-neutral-800 text-[clamp(10px,1.4vw,14px)]">
            <TabBtn label="Market" active={tab === "market"} onClick={() => setTab("market")} />
            <TabBtn label="News" active={tab === "news"} onClick={() => setTab("news")} />
            <TabBtn label="History" active={tab === "history"} onClick={() => setTab("history")} />
            <TabBtn label="Performance" active={tab === "performance"} onClick={() => setTab("performance")} />
          </div>

          <div className="p-3 space-y-3 flex flex-col h-full">

            {/* ================= MARKET ================= */}
            {tab === "market" && (
              <>
                <div
                  id={`chart_mount_${pair}`}
                  className="w-full h-[35vh] min-h-[180px] max-h-[320px]"
                />
                <GlobalLightChart
                  mountId={`chart_mount_${pair}`}
                  signal={signal}
                />

                <div>
                  <div className="text-[clamp(10px,1.4vw,14px)] text-neutral-400">Latest Signal</div>
                  <div className="font-bold text-lg">
                    {signal?.direction || "--"} {signal?.entry || ""}
                  </div>
                  <div className="text-[clamp(10px,1.4vw,14px)] text-neutral-400">
                    SL {signal?.sl || "--"} · TP {signal?.tp || "--"}
                  </div>
                </div>

                <div className="bg-neutral-800 rounded-lg p-2 text-[clamp(10px,1.4vw,14px)] text-neutral-300">
                  <div className="text-[clamp(10px,1.4vw,14px)] text-neutral-400 mb-2">Active Orders</div>

                  <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
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
                          className={`bg-neutral-900 px-2 py-2 min-h-[38px] rounded-md text-xs flex justify-between ...`}
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
                            <div className={pnlColor}>
                              {pnl.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      )

                    }) : (
                      <div className="text-neutral-500 text-[clamp(10px,1.4vw,14px)]">
                        No open orders
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ================= NEWS ================= */}
            {tab === "news" && (
              <div className="flex flex-col flex-1 min-h-0 p-[clamp(8px,1.2vw,16px)]">

                <div className="shrink-0 text-[clamp(10px,1.4vw,14px)] text-neutral-400 mb-2">
                  Market Commentary
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto bg-neutral-900 border border-neutral-800 p-[clamp(10px,1.4vw,16px)] text-[clamp(10px,1.4vw,14px)]">
                  {notes || "Coming Soon"}
                </div>

              </div>
            )}

            {/* ================= HISTORY ================= */}
            {tab === "history" && (
              <div className="flex flex-col flex-1 min-h-0 p-[clamp(8px,1.2vw,16px)]">

                <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">

                  {history?.length ? history.map((h: any, i: number) => (
                    <div
                      key={i}
                      className="bg-neutral-900 border border-neutral-800 p-[clamp(8px,1vw,14px)] flex justify-between text-[clamp(10px,1.4vw,14px)]"
                    >
                      <div>
                        <div className={h.direction === "BUY" ? "text-green-400" : "text-red-400"}>
                          {h.direction}
                        </div>
                        <div className="text-xs text-neutral-400">
                          {h.entry} → {h.exit}
                        </div>
                      </div>
                      <div className={h.pnl >= 0 ? "text-green-400" : "text-red-400"}>
                        {h.pnl}
                      </div>
                    </div>
                  )) : (
                    <div className="text-neutral-500 text-[clamp(10px,1.4vw,14px)]">
                      No history yet
                    </div>
                  )}

                </div>

              </div>
            )}

            {/* ================= PERFORMANCE ================= */}
            {tab === "performance" && (
              <div className="flex flex-col flex-1 min-h-0 p-[clamp(8px,1.2vw,16px)]">

                <div className="flex-1 min-h-0 overflow-y-auto space-y-[clamp(8px,1vh,16px)] pr-1">

                  {/* TOP METRICS */}
                  <div className="grid grid-cols-2 gap-[clamp(6px,1vw,14px)] text-[clamp(10px,1.4vw,14px)]">
                    <Metric
                      label="Win Rate"
                      value={
                        performance?.winRate !== undefined
                          ? performance.winRate + "%"
                          : "--"
                      }
                    />
                    <Metric
                      label="Profit Factor"
                      value={performance?.profitFactor ?? "--"}
                    />
                  </div>

                  {/* STAT LIST */}
                  <div className="space-y-[clamp(6px,1vh,12px)] text-[clamp(10px,1.4vw,14px)]">
                    <Stat label="Total Trades" value={performance?.trades} />
                    <Stat label="Wins" value={performance?.wins} />
                    <Stat label="Losses" value={performance?.losses} />
                    <Stat label="Total PnL" value={performance?.pnlTotal} />
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

/* ====================================================== */

function TabBtn({ label, active, onClick }: any) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className={`flex-1 py-3 text-center transition-all duration-200 ${active
        ? "text-white border-b-2 border-white bg-neutral-900"
        : "text-neutral-500 hover:text-neutral-300"
        }`}
    >
      {label}
    </button>
  )
}

function Stat({ label, value }: any) {
  return (
    <div className="flex justify-between bg-neutral-800 border border-neutral-700 p-[clamp(8px,1vw,14px)]">
      <span className="text-neutral-400">{label}</span>
      <span className="font-semibold">{value ?? "--"}</span>
    </div>
  )
}

function Metric({ label, value }: any) {
  return (
    <div className="bg-neutral-800 border border-neutral-700 p-[clamp(10px,1.4vw,18px)] text-center">
      <div className="text-neutral-400 text-[clamp(9px,1.2vw,12px)]">{label}</div>
      <div className="text-[clamp(12px,1.8vw,20px)] font-semibold">{value ?? "--"}</div>
    </div>
  )
}

/* =====================================================
   INLINE STRIP (MIN MODE)
======================================================= */

function InlineTradeStrip({ signal, direction }: any) {
  if (!signal?.entry || direction === "EXIT") return null

  const sl = Number(signal?.sl)
  const tp = Number(signal?.tp)
  const entry = Number(signal?.entry)
  const price = Number(signal?.price || entry)

  if (!sl || !tp) return null

  const isHedged = direction === "HEDGED"

  let pricePercent = 50

  if (!isHedged) {
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

    pricePercent = Math.max(0.9, Math.min(99.2, pricePercent))
  }

  const isTPside =
    direction === "BUY"
      ? price >= entry
      : direction === "SELL"
        ? price <= entry
        : false

  return (
    <div className="flex flex-col w-full gap-[clamp(1px,0.5vw,6px)]">

      <div className="relative w-full h-[clamp(2px,0.35vw,6px)]">

        <div className="absolute inset-0 bg-neutral-800 rounded-full" />

        {/* LEFT HALF */}
        <div
          className={`absolute left-0 h-full w-1/2 ${isHedged
              ? "bg-sky-500/70"
              : "bg-red-500/70"
            }`}
        />

        {/* RIGHT HALF */}
        <div
          className={`absolute right-0 h-full w-1/2 ${isHedged
              ? "bg-sky-500/70"
              : "bg-green-500/70"
            }`}
        />

        {/* SL DOT */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[clamp(6px,1.3vw,28px)] h-[clamp(6px,1.3vw,28px)] rounded-full border border-neutral-500 bg-black" />

        {/* ENTRY DOT */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[clamp(6px,1.3vw,28px)] h-[clamp(6px,1.3vw,28px)] rounded-full bg-neutral-400" />

        {/* TP DOT */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[clamp(6px,1.3vw,28px)] h-[clamp(6px,1.3vw,28px)] rounded-full border border-neutral-500 bg-black" />

        {/* LIVE DOT CONTAINER */}
        <div
          className="absolute top-1/2 flex items-center justify-center"
          style={{
            left: `${pricePercent}%`,
            transform: "translate(-50%, -50%)",
            transition: "left 300ms ease",
            width: "1px", // Minimal anchor point
            height: "1px"
          }}
        >
          {/* OUTER PULSE */}
          <div
            className={`
      absolute
      w-[clamp(12px,1.8vw,36px)]
      h-[clamp(12px,1.8vw,36px)]
      rounded-full
      animate-ping
      ${isHedged ? "bg-sky-400/35" : isTPside ? "bg-green-400/35" : "bg-red-400/35"}
    `}
            style={{ animationDuration: "0.85s" }}
          />

          {/* HALO (Glow Effect) */}
          <div
            className={`
      absolute
      w-[clamp(9px,1.4vw,28px)]
      h-[clamp(9px,1.4vw,28px)]
      rounded-full
      blur-md
      ${isHedged ? "bg-sky-500/45" : isTPside ? "bg-green-500/45" : "bg-red-500/45"}
    `}
          />

          {/* CORE DOT */}
          <div
            className={`
      absolute
      w-[clamp(6px,1.1vw,20px)]
      h-[clamp(6px,1.1vw,20px)]
      rounded-full
      shadow-[0_0_10px_rgba(0,0,0,0.5)]
      ${isHedged ? "bg-sky-400" : isTPside ? "bg-green-400" : "bg-red-400"}
    `}
          />
        </div>
      </div>

      <div className="flex justify-between text-[clamp(8px,2.4vw,16px)] text-neutral-400">
        <span>{sl}</span>
        <span>{entry}</span>
        <span>{tp}</span>
      </div>
    </div>
  )
}

/* ======================================================
   TRADE BAR (MID / MAX MODE)
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

  if (direction === "EXIT") return null
  if (!sl || !tp || !entry) return null

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

  pricePercent = Math.max(0.9, Math.min(99.2, pricePercent))

  const isTPside =
    direction === "BUY"
      ? price >= entry
      : price <= entry

  return (
    <div className="mt-3 select-none">

      <div className="relative h-3 text-[clamp(12px,1vw,16px)] text-neutral-400 mb-1">
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

        <div
          className="absolute h-[clamp(2px,0.35vw,6px)]"
          style={{
            width: `${entryPercent}%`,
            background:
              "linear-gradient(90deg, rgba(248,113,113,0.8), rgba(239,68,68,0.05))"
          }}
        />

        <div
          className="absolute h-[clamp(2px,0.35vw,6px)]"
          style={{
            left: `${entryPercent}%`,
            width: `${100 - entryPercent}%`,
            background:
              "linear-gradient(90deg, rgba(34,197,94,0.05), rgba(74,222,128,0.8))"
          }}
        />

        <div className="absolute left-0 w-3 h-3 rounded-full border border-neutral-400" />
        <div
          className="absolute w-3 h-3 rounded-full border border-neutral-400"
          style={{
            left: `${entryPercent}%`,
            transform: "translateX(-50%)"
          }}
        />
        <div className="absolute right-0 w-3 h-3 rounded-full border border-neutral-400" />

        <div
          className="absolute"
          style={{
            left: `${pricePercent}%`,
            transform: "translateX(-50%)",
            transition: "left 380ms cubic-bezier(0.22,1,0.36,1)"
          }}
        >
          <div
            className={`absolute -inset-2 rounded-full blur-md ${isTPside ? "bg-green-500/30" : "bg-red-500/30"
              }`}
          />
          <div
            className={`w-3 h-3 rounded-full ${isTPside ? "bg-green-400" : "bg-red-400"
              }`}
          />
        </div>

      </div>

      <div className="flex justify-between text-[11px] text-neutral-400 mt-1">
        <span>{sl}</span>
        <span>{entry}</span>
        <span>{tp}</span>
      </div>

    </div>
  )
}

export default React.memo(PairCard)
