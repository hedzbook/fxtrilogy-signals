// components/GlobalLightChart.tsx

"use client"

import { useEffect, useRef } from "react"
import {
    createChart,
    ColorType,
    CandlestickSeries,
    LineSeries
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

    const tpZoneRef = useRef<any>(null)
    const slZoneRef = useRef<any>(null)
    const hedgeBandRef = useRef<any>(null)

    const entryLineRef = useRef<any>(null)
    const slLineRef = useRef<any>(null)
    const tpLineRef = useRef<any>(null)

    // ======================================================
    // CREATE GLOBAL CHART
    // ======================================================
    useEffect(() => {

        if (!mountId) return

        const container = document.getElementById(mountId)
        if (!container) return
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
                secondsVisible: false
            }
        })

        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: "#22c55e",
            downColor: "#ef4444",
            borderUpColor: "#22c55e",
            borderDownColor: "#ef4444",
            wickUpColor: "#22c55e",
            wickDownColor: "#ef4444"
        })

        chartRef.current = chart
        candleSeriesRef.current = candleSeries
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

    }, [mountId, symbol])

    // ======================================================
    // 🔥 LIVE CANDLE STREAM (ALWAYS MOVING)
    // ======================================================
    const historyLoadedRef = useRef(false)

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

        // 🔥 FIRST LOAD = SET HISTORY ONCE
        if (!historyLoadedRef.current) {
            series.setData(data)
            historyLoadedRef.current = true
            return
        }

        // 🔥 AFTER THAT = STREAM ONLY LAST BAR
        const last = data[data.length - 1]

        series.update(last)

    }, [signal?.candles, signal?.price])

    // ======================================================
    // 🔥 ULTRA-PRO OVERLAY ENGINE
    // ======================================================
    useEffect(() => {

        const chart = chartRef.current
        const candleSeries = candleSeriesRef.current

        if (!chart || !candleSeries) return
        if (!signal) return

        const dir = signal?.direction
        const entry = Number(signal?.entry)
        const sl = Number(signal?.sl)
        const tp = Number(signal?.tp)

        const clearSeries = (ref: any) => {
            if (ref.current) {
                chart.removeSeries(ref.current)
                ref.current = null
            }
        }

        const clearLine = (ref: any) => {
            if (ref.current) {
                candleSeries.removePriceLine(ref.current)
                ref.current = null
            }
        }

        clearSeries(tpZoneRef)
        clearSeries(slZoneRef)
        clearSeries(hedgeBandRef)

        clearLine(entryLineRef)
        clearLine(slLineRef)
        clearLine(tpLineRef)

        // ==============================
        // HEDGED MODE
        // ==============================
        if (dir === "HEDGED" && entry) {

            const hedgeBand = chart.addSeries(LineSeries, {
                color: "rgba(56,189,248,0.02)",
                lineWidth: 1,
                priceLineVisible: false,
                lastValueVisible: false
            })

            hedgeBand.setData([
                { time: Math.floor(Date.now() / 1000) - 100000, value: entry },
                { time: Math.floor(Date.now() / 1000) + 100000, value: entry }
            ])

            hedgeBand.createPriceLine({
                price: entry,
                color: "rgba(56,189,248,0.35)",
                lineWidth: 18
            })

            hedgeBandRef.current = hedgeBand
            return
        }

        if (dir === "EXIT") return
        if (!entry || !sl || !tp) return

        entryLineRef.current = candleSeries.createPriceLine({
            price: entry,
            color: "#ffffff",
            lineWidth: 2,
            title: "ENTRY"
        })

        slLineRef.current = candleSeries.createPriceLine({
            price: sl,
            color: "#ef4444",
            lineWidth: 1,
            title: "STOP"
        })

        tpLineRef.current = candleSeries.createPriceLine({
            price: tp,
            color: "#22c55e",
            lineWidth: 1,
            title: "TP"
        })

        const tpZone = chart.addSeries(LineSeries, {
            color: "rgba(56,189,248,0.01)",
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false
        })

        tpZone.setData([
            { time: Math.floor(Date.now() / 1000) - 100000, value: tp },
            { time: Math.floor(Date.now() / 1000) + 100000, value: tp }
        ])

        tpZone.createPriceLine({
            price: entry,
            color: "rgba(56,189,248,0.18)",
            lineWidth: 24
        })

        tpZoneRef.current = tpZone

        const slZone = chart.addSeries(LineSeries, {
            color: "rgba(239,68,68,0.01)",
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false
        })

        slZone.setData([
            { time: Math.floor(Date.now() / 1000) - 100000, value: sl },
            { time: Math.floor(Date.now() / 1000) + 100000, value: sl }
        ])

        slZone.createPriceLine({
            price: entry,
            color: "rgba(239,68,68,0.18)",
            lineWidth: 24
        })

        slZoneRef.current = slZone

    }, [signal])

    return null
}
