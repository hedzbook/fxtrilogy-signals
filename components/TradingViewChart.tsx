"use client"

import { useEffect, useRef } from "react"

export default function TradingViewChart({ symbol }: { symbol: string }) {

  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {

    if (!container.current) return

    container.current.innerHTML = ""

    const script = document.createElement("script")
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
    script.type = "text/javascript"
    script.async = true

script.innerHTML = JSON.stringify({
  autosize: true,
  symbol: "OANDA:" + symbol,
  interval: "15",
  timezone: "Etc/UTC",
  theme: "dark",
  style: "1",
  hide_top_toolbar: true,
  hide_side_toolbar: true,
  hide_legend: true,
  allow_symbol_change: false,

  studies: ["Volume@tv-basicstudies"],

  overrides: {
    "paneProperties.background": "#1E1E1E",
    "paneProperties.vertGridProperties.color": "rgba(0,0,0,0)",
    "paneProperties.horzGridProperties.color": "rgba(0,0,0,0)",

    "mainSeriesProperties.candleStyle.upColor": "#DCDCDC",
    "mainSeriesProperties.candleStyle.downColor": "#DCDCDC",
    "mainSeriesProperties.candleStyle.borderUpColor": "#DCDCDC",
    "mainSeriesProperties.candleStyle.borderDownColor": "#DCDCDC",
    "mainSeriesProperties.candleStyle.wickUpColor": "#DCDCDC",
    "mainSeriesProperties.candleStyle.wickDownColor": "#DCDCDC",

    "volumePaneSize": "medium",
    "volume.volume.color.0": "#FFD700",
    "volume.volume.color.1": "#FFD700"
  }
})

    container.current.appendChild(script)

  }, [symbol])

  return (
    <div className="w-full h-100 rounded-lg overflow-hidden bg-neutral-900">
      <div ref={container} className="tradingview-widget-container w-full h-full" />
    </div>
  )
}
