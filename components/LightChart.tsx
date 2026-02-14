"use client"

import { useEffect, useRef } from "react"
import {
  createChart,
  ColorType,
  CrosshairMode,
  CandlestickSeries,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp
} from "lightweight-charts"

export default function LightChart({
  symbol,
  price
}: {
  symbol: string
  price?: number
}) {

  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // =====================================================
  // CREATE CHART
  // =====================================================
  useEffect(() => {

    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {

      autoSize: true,

      layout: {
        background: { type: ColorType.Solid, color: "#1E1E1E" },
        textColor: "#aaa"
      },

      grid: {
        vertLines: { color: "rgba(255,255,255,0.03)" },
        horzLines: { color: "rgba(255,255,255,0.03)" }
      },

      crosshair: {
        mode: CrosshairMode.Normal
      },

      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.1)"
      },

      timeScale: {
        borderColor: "rgba(255,255,255,0.1)",
        timeVisible: true
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
    seriesRef.current = candleSeries

    // ✅ FIXED TIME TYPE
    const now = Math.floor(Date.now() / 1000) as UTCTimestamp

    candleSeries.setData([
      {
        time: now,
        open: price || 0,
        high: price || 0,
        low: price || 0,
        close: price || 0
      }
    ])

    chart.timeScale().fitContent()

    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.current) return
      chart.applyOptions({
        width: containerRef.current.clientWidth
      })
    })

    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }

  }, [])

  // =====================================================
  // LIVE PRICE UPDATE
  // =====================================================
  useEffect(() => {

    if (!seriesRef.current || !price) return

    // ✅ UTCTimestamp REQUIRED
    const candleTime =
      (Math.floor(Date.now() / 60000) * 60) as UTCTimestamp

    seriesRef.current.update({
      time: candleTime,
      open: price,
      high: price,
      low: price,
      close: price
    })

  }, [price])

  return (
    <div
      ref={containerRef}
      className="w-full h-[300px] rounded-lg overflow-hidden"
    />
  )
}
