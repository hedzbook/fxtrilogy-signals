"use client"

import { useEffect } from "react"

export default function AccountStrip({
    pairs,
    onStateChange
}: {
    pairs: any[]
    onStateChange?: (state: string, intensity: number, pulse: number) => void
}) {

    let totalFloating = 0
    let totalLots = 0
    let buyVol = 0
    let sellVol = 0

    pairs.forEach(p => {

        const orders = p.signal?.orders || []

        orders.forEach((pos: any) => {
            const lot = Number(pos.lots || 0)
            const pnl = Number(pos.profit || 0)

            totalLots += lot
            totalFloating += pnl

            if (pos.direction === "BUY") buyVol += lot
            if (pos.direction === "SELL") sellVol += lot
        })

    })

    const netState =
        buyVol === 0 && sellVol === 0
            ? "FLAT"
            : buyVol === sellVol
                ? "HEDGED"
                : buyVol > sellVol
                    ? "NET BUY"
                    : "NET SELL"

    const imbalance = Math.abs(buyVol - sellVol)
    const totalVol = buyVol + sellVol || 1
    const intensity = Math.min(1, imbalance / totalVol)
    const pulse = Math.min(1, Math.abs(totalFloating) / (totalLots || 1))

    useEffect(() => {
        if (typeof onStateChange === "function") {
            onStateChange(netState, intensity, pulse)
        }
    }, [netState, intensity, pulse])

    return (
        <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 border-b border-neutral-800 h-14 flex items-center shadow-[0_6px_20px_rgba(0,0,0,0.6)]">

            {/* 🔥 CONTENT WRAPPER (MATCHES px-4 BELOW CARDS) */}
            <div className="px-4 w-full flex items-center relative text-sm">

                {/* LEFT — LOTS */}
                <div className="font-semibold min-w-[90px]">
                    <span className="text-neutral-400 mr-2">LOTS</span>
                    {totalLots.toFixed(2)}
                </div>

                {/* CENTER — PNL */}
                <div className="absolute left-1/2 -translate-x-1/2 font-semibold">
                    <span className="text-neutral-400 mr-2">~PnL</span>
                    <span className={totalFloating >= 0 ? "text-green-400" : "text-red-400"}>
                        {totalFloating.toFixed(2)}
                    </span>
                </div>

                {/* RIGHT — NET STATE */}
                <div className="ml-auto font-semibold text-sky-400">
                    {netState}
                </div>

            </div>

        </div>
    )
}
