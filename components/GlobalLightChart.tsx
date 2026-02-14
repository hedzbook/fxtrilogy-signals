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
    mountId
}: {
    symbol?: string
    price?: number
    mountId?: string
}) {

    const chartRef = useRef<any>(null)
    const seriesRef = useRef<any>(null)
    const candleRef = useRef<any>(null)

    // ======================================
    // CREATE CHART
    // ======================================
    useEffect(() => {

        if (!mountId) return

        const container = document.getElementById(mountId)
        if (!container) return

        container.innerHTML = ""

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
                secondsVisible: true
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
        seriesRef.current = series

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

    }, [mountId, symbol])

    // ======================================
    // LIVE PRICE UPDATE
    // ======================================
    useEffect(() => {

        if (!seriesRef.current || !price) return

        // 🔥 BUILD M15 CANDLE
        const candleTime =
            Math.floor(Date.now() / (15 * 60 * 1000)) * 900

        let candle = candleRef.current

        if (!candle || candle.time !== candleTime) {

            candle = {
                time: candleTime,
                open: price,
                high: price,
                low: price,
                close: price
            }

            candleRef.current = candle

        } else {

            candle.high = Math.max(candle.high, price)
            candle.low = Math.min(candle.low, price)
            candle.close = price
        }

        seriesRef.current.update(candle)

    }, [price])

    return null
}
