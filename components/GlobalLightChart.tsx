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
                secondsVisible: false,
                rightOffset: 8,
                barSpacing: 8,
                fixRightEdge: false
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
    // 🔥 LIVE CANDLE STREAM
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

        const last = data[data.length - 1]
        series.update(last)

    }, [signal?.candles, signal?.price])

    // ======================================================
    // 🔥 OVERLAY ENGINE (NO DUPLICATES)
    // ======================================================
    useEffect(() => {

        const candleSeries = candleSeriesRef.current
        if (!candleSeries) return
        if (!signal) return

        // 🔴 CLEAR OLD LINES FIRST
        dynamicLinesRef.current.forEach((l:any)=>{
            candleSeries.removePriceLine(l)
        })
        dynamicLinesRef.current = []

        const orders = signal?.orders || []
        if (!orders.length) return

        orders.forEach((o:any,index:number)=>{

            const entry = Number(o.entry)
            if(!entry) return

            const isLatest = index === orders.length - 1

            const color =
                o.direction === "BUY"
                    ? "#22c55e"
                    : "#ef4444"

            // --------------------------------------------------
            // PREVIOUS / HEDGED POSITIONS
            // Thin line ONLY (no label / no price box)
            // --------------------------------------------------
            if(!isLatest){
                const line = candleSeries.createPriceLine({
                    price: entry,
                    color,
                    lineWidth: 1,
                    axisLabelVisible:false,
                    title:""
                })
                dynamicLinesRef.current.push(line)
                return
            }

            // --------------------------------------------------
            // MAIN ACTIVE POSITION
            // ENTRY LABEL
            // --------------------------------------------------
            const entryLine = candleSeries.createPriceLine({
                price: entry,
                color:"#ffffff",
                lineWidth:2,
                title:"ENTRY"
            })
            dynamicLinesRef.current.push(entryLine)

            const sl = Number(signal?.sl)
            const tp = Number(signal?.tp)

            if(sl){
                const slLine = candleSeries.createPriceLine({
                    price: sl,
                    color:"#ef4444",
                    lineWidth:1,
                    title:"STOP"
                })
                dynamicLinesRef.current.push(slLine)
            }

            if(tp){
                const tpLine = candleSeries.createPriceLine({
                    price: tp,
                    color:"#22c55e",
                    lineWidth:1,
                    title:"TP"
                })
                dynamicLinesRef.current.push(tpLine)
            }

        })

    },[signal])

    return null
}
