"use client"

import { useEffect } from "react"

type Props = {
  pair: string
  signal?: any
  onClose: () => void
}

export default function SignalPanel({
  pair,
  signal,
  onClose
}: Props) {

  // 🔒 Prevent background scroll when panel open
  useEffect(() => {
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = "auto"
    }
  }, [])

  const dir = signal?.direction || "--"
  const entry = signal?.entry || "--"
  const sl = signal?.sl || "--"
  const tp = signal?.tp || "--"

  return (
    <div className="fixed inset-0 z-50 flex items-end">

      {/* BACKDROP */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* PANEL */}
      <div
        className="
        relative w-full
        h-[78vh]
        bg-neutral-900
        rounded-t-2xl
        border-t border-neutral-700
        overflow-y-auto
        overscroll-contain
        touch-pan-y
        p-4 space-y-4
      "
      >

        {/* Drag Handle */}
        <div className="w-12 h-1.5 bg-neutral-600 rounded-full mx-auto mb-4" />

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div className="text-lg font-bold">{pair}</div>

          <button
            onClick={onClose}
            className="text-neutral-400 text-lg"
          >
            ✕
          </button>
        </div>

        {/* LATEST SIGNAL */}
        <div>
          <div className="text-sm text-neutral-400">
            Latest Signal
          </div>

          <div className="text-xl font-bold">
            {dir} {entry}
          </div>

          <div className="text-sm text-neutral-400">
            SL {sl} · TP {tp}
          </div>
        </div>

        {/* SENTIMENT BAR */}
        <div>
          <div className="text-sm text-neutral-400">
            Market Sentiment
          </div>
          <div className="bg-neutral-800 rounded-lg h-3 mt-2" />
        </div>

        {/* INDICATORS */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>RSI Buy</div>
          <div>MACD Sell</div>
          <div>CCI Buy</div>
          <div>ADX Buy</div>
        </div>

        {/* MARKET NOTES / NEWS FEED */}
        <div>
          <div className="text-sm text-neutral-400">
            Market Notes
          </div>

          <div className="space-y-2 mt-2 text-sm leading-relaxed">
            <p>• Structure remains bullish above H1 support</p>
            <p>• Momentum expanding with volume</p>
            <p>• Liquidity sweep detected on M15</p>
            <p>• ChatGPT news stream will render here dynamically</p>
            <p>• Panel remains scrollable without moving cards behind</p>
          </div>
        </div>

      </div>
    </div>
  )
}
