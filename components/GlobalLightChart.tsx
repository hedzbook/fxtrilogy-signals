"use client"

import { useEffect, useRef } from "react"
import {
  createChart,
  ColorType,
  LineSeries
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

    // ✅ v5 API
    const series = chart.addSeries(LineSeries, {
      color: "#22c55e",
      lineWidth: 2
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

    const time = Math.floor(Date.now() / 1000)

    seriesRef.current.update({
      time,
      value: price
    })

  }, [price])

  return null
}
