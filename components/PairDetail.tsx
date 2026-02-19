// components/PairDetail.tsx

"use client"

import { useState } from "react"
import GlobalLightChart from "./GlobalLightChart"

type Props = {
    pair: string
    signal: any
    data: any
    onClose: () => void
}

export default function PairDetail({
    pair,
    signal,
    data,
    onClose
}: Props) {

    const [tab, setTab] = useState<"market" | "news" | "history" | "performance">("market")

    return (
        <div className="flex flex-col h-full bg-black min-h-0">

            {/* HEADER */}
            <div className="shrink-0 flex items-center justify-between px-4 py-[clamp(6px,1vh,10px)] border-b border-neutral-800">
                <div className="font-semibold text-[clamp(12px,1.8vw,18px)] leading-none">
                    {pair}
                </div>
                <button
                    onClick={onClose}
                    className="text-[clamp(10px,1.6vw,14px)] text-neutral-400 hover:text-white leading-none"
                >
                    CLOSE
                </button>
            </div>

            {/* CHART (FIXED HEIGHT) */}
            <div className="shrink-0 h-[clamp(180px,35vh,380px)]">
                <div
                    id={`chart_mount_${pair}`}
                    className="w-full h-full"
                />
                <GlobalLightChart
                    mountId={`chart_mount_${pair}`}
                    signal={signal}
                />
            </div>

            {/* TABS (FIXED) */}
            <div className="shrink-0 flex border-b border-neutral-800 text-[clamp(10px,1.4vw,14px)]">
                <Tab label="Market" active={tab === "market"} onClick={() => setTab("market")} />
                <Tab label="News" active={tab === "news"} onClick={() => setTab("news")} />
                <Tab label="History" active={tab === "history"} onClick={() => setTab("history")} />
                <Tab label="Statistics" active={tab === "performance"} onClick={() => setTab("performance")} />
            </div>

            {/* CONTENT AREA — ONLY THIS SCROLLS */}
            <div className="flex-1 flex flex-col min-h-0">

                {tab === "market" && (
                    <div className="flex flex-col flex-1 min-h-0 gap-[clamp(8px,1vh,16px)] p-[clamp(8px,1.2vw,16px)]">


                        <div>
                            <div className="text-[clamp(10px,1.4vw,14px)] text-neutral-400">Latest Signal</div>
                            <div className="font-semibold text-[clamp(12px,1.8vw,18px)] leading-tight">
                                {signal?.direction || "--"} {signal?.entry || ""}
                            </div>
                            <div className="text-[clamp(10px,1.4vw,14px)] text-neutral-400">
                                SL {signal?.sl || "--"} · TP {signal?.tp || "--"}
                            </div>
                        </div>

                        <div className="flex flex-col flex-1 min-h-0 bg-neutral-900 border border-neutral-800 p-[clamp(8px,1vw,14px)] text-[clamp(10px,1.4vw,15px)]">

                            <div className="shrink-0 text-neutral-400 mb-2">
                                Active Orders
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-2 pr-1">

                                {data?.orders?.length ? data.orders.map((o: any, i: number) => (
                                    <div
                                        key={i}
                                        className="flex justify-between bg-neutral-800 p-2"
                                    >
                                        <div>
                                            <div className={o.direction === "BUY" ? "text-green-400" : "text-red-400"}>
                                                {o.direction}
                                            </div>
                                            <div className="text-neutral-400 text-xs">
                                                ENTRY {o.entry}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div>{o.lots}</div>
                                            <div className={Number(o.profit) >= 0 ? "text-green-400" : "text-red-400"}>
                                                {Number(o.profit).toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-neutral-500">
                                        No open orders
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                )}

                {tab === "news" && (
                    <div className="flex flex-col flex-1 min-h-0 p-[clamp(8px,1.2vw,16px)]">

                        <div className="shrink-0 text-neutral-400 mb-2">
                            Market Commentary
                        </div>

                        <div className="flex-1 min-h-0 overflow-y-auto bg-neutral-900 border border-neutral-800 p-[clamp(10px,1.4vw,16px)] text-[clamp(10px,1.4vw,14px)] pr-1">
                            {data?.notes || "Coming Soon"}
                        </div>

                    </div>
                )}

                {tab === "history" && (
                    <div className="flex flex-col flex-1 min-h-0 p-[clamp(8px,1.2vw,16px)]">

                        <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">

                            {data?.history?.length ? data.history.map((h: any, i: number) => (
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

                {tab === "performance" && (
                    <div className="flex flex-col flex-1 min-h-0 p-[clamp(8px,1.2vw,16px)]">

                        <div className="flex-1 min-h-0 overflow-y-auto space-y-[clamp(8px,1vh,16px)] pr-1">

                            <div className="grid grid-cols-2 gap-[clamp(6px,1vw,14px)] text-[clamp(10px,1.4vw,14px)]">
                                <Metric
                                    label="Win Rate"
                                    value={
                                        data?.performance?.winRate !== undefined
                                            ? data.performance.winRate + "%"
                                            : "--"
                                    }
                                />
                                <Metric
                                    label="Profit Factor"
                                    value={data?.performance?.profitFactor ?? "--"}
                                />
                            </div>

                            <div className="space-y-[clamp(6px,1vh,12px)] text-[clamp(10px,1.4vw,14px)]">
                                <Stat label="Total Trades" value={data?.performance?.trades} />
                                <Stat label="Wins" value={data?.performance?.wins} />
                                <Stat label="Losses" value={data?.performance?.losses} />
                                <Stat label="Total PnL" value={data?.performance?.pnlTotal} />
                            </div>

                        </div>

                    </div>
                )}
            </div>

        </div>
    )
}

function Tab({ label, active, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`
        flex-1
        py-[clamp(6px,1vh,12px)]
        text-[clamp(10px,1.6vw,16px)]
        leading-none
        transition-all
        ${active
                    ? "text-white border-b-2 border-white bg-neutral-900"
                    : "text-neutral-500 hover:text-neutral-300"}
      `}
        >
            {label.toUpperCase()}
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


