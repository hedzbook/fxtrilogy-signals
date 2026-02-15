// components/GlobalLightChart.tsx

"use client"

import { useEffect, useRef } from "react"
import {
    createChart,
    ColorType,
    CandlestickSeries
} from "lightweight-charts"

export default function GlobalLightChart({
    symbol,
    price,
    mountId,
    signal
}: {
    symbol?: string
    price?: number
    mountId?: string
    signal?: any
}) {

    const chartRef = useRef<any>(null)
    const candleSeriesRef = useRef<any>(null)
    const dynamicLinesRef = useRef<any[]>([])
    const historyLoadedRef = useRef(false)

    // ======================================================
    // CREATE GLOBAL CHART
    // ======================================================
// ======================================================
// 🔥 OVERLAY ENGINE (MT5 MIRROR LOGIC)
// ======================================================
useEffect(() => {

    const candleSeries = candleSeriesRef.current
    if (!candleSeries || !signal) return

    // 🔴 Clear old lines
    dynamicLinesRef.current.forEach((l: any) => {
        candleSeries.removePriceLine(l)
    })
    dynamicLinesRef.current = []

    let orders = signal?.orders || []

    // 🔥 Fallback if orders not yet synced
    if (!orders.length && signal?.direction && signal?.entry) {

        orders = [{
            label: signal.direction === "BUY" ? "B1" : "S1",
            entry: signal.entry,
            direction: signal.direction
        }]
    }

    if (!orders.length) return

    orders.forEach((o: any, index: number) => {

        const entry = Number(o.entry)
        if (!entry) return

        const isLatest = index === orders.length - 1

        const color =
            o.direction === "BUY"
                ? "#22c55e"
                : "#ef4444"

        // ======================
        // ENTRY LINE (B1, S1...)
        // ======================
        const entryLine = candleSeries.createPriceLine({
            price: entry,
            color,
            lineWidth: isLatest ? 2 : 1,
            axisLabelVisible: isLatest,
            title: o.label || ""
        })

        dynamicLinesRef.current.push(entryLine)

        // Only latest gets SL / TP
        if (!isLatest) return

        const sl = Number(signal?.sl)
        const tp = Number(signal?.tp)

        // ======================
        // HEDGE LABEL
        // BUY → SS
        // SELL → BS
        // ======================
        if (sl) {

            const hedgeLabel =
                o.direction === "BUY"
                    ? "SS"
                    : "BS"

            const slLine = candleSeries.createPriceLine({
                price: sl,
                color: "#ef4444",
                lineWidth: 1,
                title: hedgeLabel
            })

            dynamicLinesRef.current.push(slLine)
        }

        if (tp) {

            const tpLine = candleSeries.createPriceLine({
                price: tp,
                color: "#22c55e",
                lineWidth: 1,
                title: "TP"
            })

            dynamicLinesRef.current.push(tpLine)
        }

    })

}, [signal])

    return null
}
