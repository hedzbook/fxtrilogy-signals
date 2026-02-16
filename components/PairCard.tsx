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
            className={`font-bold ${
              liveDir === "BUY"
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

        {/* Exposure */}
        {signal && (
          <div className="flex justify-between items-center text-[11px] mt-1">
            <div className="text-neutral-400 font-semibold tracking-widest">
              {(signal?.lots ?? "-")} LOTS
            </div>

            <div className="font-semibold tracking-wide">
              <span className="text-green-400">{signal?.buys ?? 0}B</span>
              <span className="text-neutral-500 px-1">/</span>
              <span className="text-red-400">{signal?.sells ?? 0}S</span>
            </div>
          </div>
        )}

        {/* TradeBar hidden in MIN mode */}
        {!isMin &&
          liveDir !== "EXIT" &&
          (liveDir === "HEDGED" || (signal?.entry && signal?.sl && signal?.tp)) && (
            <TradeBar signal={signal} direction={liveDir} />
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
              className={`w-full h-[280px] rounded-lg bg-neutral-900 ${
                tab === "market" ? "block" : "hidden"
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
                            <div className={`font-semibold ${
                              o.direction === "BUY"
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

/* ======================================================
   SIMPLIFIED TRADE BAR (NO MT5/GAS IMPACT)
====================================================== */

function TradeBar({
  signal,
  direction
}: {
  signal: any
  direction?: TradeDirection
}) {

  if (!signal?.entry) return null

  return (
    <div className="mt-3 select-none">

      <div className="relative h-2 bg-neutral-800 rounded-full">

        <div className={`absolute left-0 top-0 h-2 rounded-full ${
          direction === "BUY"
            ? "bg-green-500/60 w-1/2"
            : direction === "SELL"
              ? "bg-red-500/60 w-1/2"
              : "bg-sky-500/60 w-full"
        }`} />

      </div>

      <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
        <span>{signal?.sl ?? "--"}</span>
        <span>{signal?.entry}</span>
        <span>{signal?.tp ?? "--"}</span>
      </div>

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
      className={`flex-1 py-3 text-center transition-all duration-200 ${
        active
          ? "text-white border-b-2 border-white bg-neutral-900"
          : "text-neutral-500 hover:text-neutral-300"
      }`}
    >
      {label}
    </button>
  )
}

export default React.memo(PairCard)
