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
      symbol: "OANDA:" + symbol, // 🔥 safest universal feed
      interval: "15",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      hide_top_toolbar: true,
      hide_legend: true,
      save_image: false,
      container_id: "tv_" + symbol
    })

    container.current.appendChild(script)

  }, [symbol])

  return (
    <div className="w-full h-150 rounded-lg overflow-hidden bg-neutral-900">
      <div ref={container} className="tradingview-widget-container w-full h-full" />
    </div>
  )
}
