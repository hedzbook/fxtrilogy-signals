// components/GlobalLightChart.tsx

"use client"

import { useEffect, useRef } from "react"
import {
    createChart,
    ColorType,
    CandlestickSeries
} from "lightweight-charts"

export default function GlobalLightChart({
    mountId,
    signal
}: {
    mountId?: string
    signal?: any
}) {

    const chartRef = useRef<any>(null)
    const candleSeriesRef = useRef<any>(null)
    const dynamicLinesRef = useRef<any[]>([])
    const historyLoadedRef = useRef(false)

    // ======================================================
    // CREATE CHART
    // ======================================================
    useEffect(() => {

        if (!mountId) return

        const container = document.getElementById(mountId)
        if (!container) return

        // Clear previous
        while (container.firstChild) {
            container.removeChild(container.firstChild)
        }

        const chart = createChart(container, {
            layout: {
                background: { type: ColorType.Solid, color: "#1E1E1E" },
                textColor: "#888"
            },
            grid: {
                vertLines: { color: "rgba(255,255,255,0.03)" },
                horzLines: { color: "rgba(255,255,255,0.03)" }
            },
            rightPriceScale: {
                borderColor: "rgba(255,255,255,0.08)"
            },
            timeScale: {
                borderColor: "rgba(255,255,255,0.08)",
                timeVisible: true,
                secondsVisible: false,
                rightOffset: 8,
                barSpacing: 8
            }
        })

        const series = chart.addSeries(CandlestickSeries, {
            upColor: "#22c55e",
            downColor: "#ef4444",
            borderUpColor: "#22c55e",
            borderDownColor: "#ef4444",
            wickUpColor: "#22c55e",
            wickDownColor: "#ef4444"
        })

        chartRef.current = chart
        candleSeriesRef.current = series
        historyLoadedRef.current = false

        const resizeObserver = new ResizeObserver(() => {
            chart.applyOptions({
                width: container.clientWidth,
                height: container.clientHeight
            })
        })

        resizeObserver.observe(container)

        return () => {
            resizeObserver.disconnect()
            chart.remove()
        }

    }, [mountId])

    // ======================================================
    // CANDLE STREAM (50 M15 candles)
    // ======================================================
    useEffect(() => {

        const series = candleSeriesRef.current
        if (!series) return
        if (!signal?.candles) return

        const data = signal.candles.map((c: any) => ({
            time: Number(c.time),
            open: Number(c.open),
            high: Number(c.high),
            low: Number(c.low),
            close: Number(c.close)
        }))

        if (!data.length) return

        if (!historyLoadedRef.current) {
            series.setData(data)
            chartRef.current?.timeScale().scrollToPosition(8, false)
            historyLoadedRef.current = true
            return
        }

        series.update(data[data.length - 1])

    }, [signal?.candles])

    // ======================================================
    // OVERLAY ENGINE (MT5 MIRROR LOGIC)
    // ======================================================
    useEffect(() => {

        const series = candleSeriesRef.current
        if (!series || !signal) return

        // Clear old lines
        dynamicLinesRef.current.forEach((l: any) => {
            series.removePriceLine(l)
        })
        dynamicLinesRef.current = []

        let orders = signal?.orders || []

        // Fallback if orders not synced yet
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

            // ENTRY LINE
            const entryLine = series.createPriceLine({
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

            // HEDGE LABEL
            if (sl) {

                const hedgeLabel =
                    o.direction === "BUY"
                        ? "SS"
                        : "BS"

                const slLine = series.createPriceLine({
                    price: sl,
                    color: "#ef4444",
                    lineWidth: 1,
                    title: hedgeLabel
                })

                dynamicLinesRef.current.push(slLine)
            }

            if (tp) {

                const tpLine = series.createPriceLine({
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
