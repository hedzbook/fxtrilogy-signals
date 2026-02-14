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

        p.orders?.forEach((o: any) => {

            const entry = Number(o.entry)
            const price = Number(p.signal?.price)

            if (!entry || !price) return

            let pnl = 0

            if (o.direction === "BUY") {
                pnl = price - entry
                buyVol += Number(o.lots || 0)
            }

            if (o.direction === "SELL") {
                pnl = entry - price
                sellVol += Number(o.lots || 0)
            }

            totalFloating += pnl
            totalLots += Number(o.lots || 0)

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

    // exposure intensity 0 → 1
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
        <div className="bg-neutral-900 border-b border-neutral-800 p-3 flex justify-between text-sm">

            <div className="space-x-4">
                <span className="text-neutral-400">LOTS</span>
                <span className="font-semibold">{totalLots.toFixed(2)}</span>
            </div>

            <div className="space-x-4">
                <span className="text-neutral-400">FLOATING</span>
                <span className={totalFloating >= 0 ? "text-green-400" : "text-red-400"}>
                    {totalFloating.toFixed(2)}
                </span>
            </div>

            <div className="font-semibold text-sky-400">
                {netState}
            </div>

        </div>
    )
}
