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

    const candleRef = useRef<any>(null)

    // ======================================================
    // CREATE GLOBAL CHART
    // ======================================================
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

        const resizeObserver = new ResizeObserver(() => {
            chart.applyOptions({
                width: container.clientWidth,
                height: container.clientHeight
            })
        })

        resizeObserver.observe(container)

        return () => {
            chart.remove()
            resizeObserver.disconnect()
        }

    }, [mountId, symbol])

    // ======================================================
    // LIVE M15 CANDLE BUILDER
    // ======================================================
    useEffect(() => {

        if (!candleSeriesRef.current || price === undefined) return

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

        candleSeriesRef.current.update(candle)

    }, [price])

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

        // ----------------------------
        // CLEAR EVERYTHING FIRST
        // ----------------------------
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

        // ==================================================
        // HEDGED MODE (buyVol == sellVol)
        // ==================================================
        if (dir === "HEDGED" && entry) {

            const hedgeBand = chart.addSeries(LineSeries, {
                color: "rgba(56,189,248,0.02)",
                lineWidth: 1,
                priceLineVisible: false,
                lastValueVisible: false
            })

            hedgeBand.setData([
                { time: Math.floor(Date.now()/1000)-100000, value: entry },
                { time: Math.floor(Date.now()/1000)+100000, value: entry }
            ])

            hedgeBand.createPriceLine({
                price: entry,
                color: "rgba(56,189,248,0.35)",
                lineWidth: 18
            })

            hedgeBandRef.current = hedgeBand
            return
        }

        // EXIT = nothing
        if (dir === "EXIT") return

        if (!entry || !sl || !tp) return

        // ==================================================
        // ENTRY GLOW LINE
        // ==================================================
        entryLineRef.current = candleSeries.createPriceLine({
            price: entry,
            color: "#ffffff",
            lineWidth: 2,
            title: "ENTRY"
        })

        // ==================================================
        // STOP LINE
        // ==================================================
        slLineRef.current = candleSeries.createPriceLine({
            price: sl,
            color: "#ef4444",
            lineWidth: 1,
            title: "STOP"
        })

        // ==================================================
        // TP LINE
        // ==================================================
        tpLineRef.current = candleSeries.createPriceLine({
            price: tp,
            color: "#22c55e",
            lineWidth: 1,
            title: "TP"
        })

        // ==================================================
        // 🔵 TP RISK ZONE (Institutional Band)
        // ==================================================
        const tpZone = chart.addSeries(LineSeries, {
            color: "rgba(56,189,248,0.01)",
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false
        })

        tpZone.setData([
            { time: Math.floor(Date.now()/1000)-100000, value: tp },
            { time: Math.floor(Date.now()/1000)+100000, value: tp }
        ])

        tpZone.createPriceLine({
            price: entry,
            color: "rgba(56,189,248,0.18)",
            lineWidth: 24
        })

        tpZoneRef.current = tpZone

        // ==================================================
        // 🔴 SL RISK ZONE
        // ==================================================
        const slZone = chart.addSeries(LineSeries, {
            color: "rgba(239,68,68,0.01)",
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false
        })

        slZone.setData([
            { time: Math.floor(Date.now()/1000)-100000, value: sl },
            { time: Math.floor(Date.now()/1000)+100000, value: sl }
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
