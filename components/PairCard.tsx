"use client"

type Props = {
  pair: string
  open?: boolean
  direction?: "BUY" | "SELL"
  signal?: any
  onToggle: () => void
}

export default function PairCard({
  pair,
  open,
  onToggle,
  direction,
  signal
}: Props) {

  const dir = direction || "--"

  return (
    <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900 transition-all active:scale-[0.99]">

      {/* HEADER */}
      <div
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        className="p-4 cursor-pointer"
      >
        <div className="w-full">

          <div className="flex justify-between items-center">
            <div className="font-semibold">{pair}</div>

            <div
              className={`font-bold ${
                dir === "BUY"
                  ? "text-green-400"
                  : dir === "SELL"
                  ? "text-red-400"
                  : "text-neutral-500"
              }`}
            >
              {dir}
            </div>
          </div>

          {signal?.entry && signal?.sl && signal?.tp && (
            <TradeBar signal={signal} direction={dir} />
          )}

        </div>
      </div>

      {open && (
        <div className="border-t border-neutral-800 max-h-[60vh] overflow-y-auto overscroll-contain touch-pan-y p-4 space-y-4">

          <div className="w-full h-48 bg-neutral-800 rounded-lg flex items-center justify-center text-neutral-500">
            Chart will render here
          </div>

          <div>
            <div className="text-sm text-neutral-400">Latest Signal</div>
            <div className="font-bold text-lg">
              {signal?.direction || "--"} {signal?.entry || ""}
            </div>
            <div className="text-sm text-neutral-400">
              SL {signal?.sl || "--"} · TP {signal?.tp || "--"}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

/* ======================================================
   INSTITUTIONAL TRADE BAR
====================================================== */

function TradeBar({
  signal,
  direction
}: {
  signal: any
  direction?: "BUY" | "SELL" | "--"
}) {

  const sl = Number(signal?.sl)
  const tp = Number(signal?.tp)
  const entry = Number(signal?.entry)
  const price = Number(signal?.price || entry)

  if (!sl || !tp || !entry) return null

  // 🔥 ONE CONSISTENT COORDINATE SYSTEM
  // LEFT = SL
  // RIGHT = TP

  const range = tp - sl
  if (!range) return null

  const entryPercent = ((entry - sl) / range) * 100
  let pricePercent = ((price - sl) / range) * 100

  // clamp inside bar
  pricePercent = Math.max(0, Math.min(100, pricePercent))

  // 🔥 PROFIT SIDE LOGIC
  const isTPside =
    direction === "BUY"
      ? price >= entry
      : price <= entry

  return (
    <div className="mt-3 select-none">

      {/* LABELS */}
      <div className="flex justify-between text-[10px] text-neutral-400 mb-1">
        <span>SL / HEDZ</span>
        <span>ENTRY</span>
        <span>TP</span>
      </div>

      <div className="relative h-6 flex items-center overflow-visible">

        {/* 🔴 LEFT RED ZONE */}
        <div
          className="absolute h-[2px]"
          style={{
            width: `${entryPercent}%`,
            background:
              "linear-gradient(90deg, rgba(220,38,38,0.05), rgba(248,113,113,0.8))"
          }}
        />

        {/* 🟢 RIGHT GREEN ZONE */}
        <div
          className="absolute h-[2px]"
          style={{
            left: `${entryPercent}%`,
            width: `${100 - entryPercent}%`,
            background:
              "linear-gradient(90deg, rgba(74,222,128,0.8), rgba(34,197,94,0.05))"
          }}
        />

        {/* HOLLOW DOTS */}
        <div className="absolute left-0 w-3 h-3 rounded-full border border-neutral-400" />

        <div
          className="absolute w-3 h-3 rounded-full border border-neutral-400"
          style={{
            left: `${entryPercent}%`,
            transform: "translateX(-50%)"
          }}
        />

        <div className="absolute right-0 w-3 h-3 rounded-full border border-neutral-400" />

        {/* 🔥 LIVE PRICE DOT */}
        <div
          className="absolute"
          style={{
            transform: `translateX(calc(${pricePercent}% - 50%))`,
            transition: "transform 380ms cubic-bezier(0.22,1,0.36,1)",
            willChange: "transform"
          }}
        >
          {/* glow trail */}
          <div
            className={`absolute -inset-2 rounded-full blur-md ${
              isTPside ? "bg-green-500/30" : "bg-red-500/30"
            }`}
          />

          {/* core */}
          <div
            className={`w-3 h-3 rounded-full ${
              isTPside ? "bg-green-400" : "bg-red-400"
            }`}
            style={{
              boxShadow: isTPside
                ? "0 0 18px rgba(74,222,128,0.9)"
                : "0 0 18px rgba(248,113,113,0.9)",
              animation: "instPulse 1.6s cubic-bezier(0.4,0,0.2,1) infinite"
            }}
          />
        </div>

      </div>

      {/* PRICES */}
      <div className="flex justify-between text-[11px] text-neutral-400 mt-1">
        <span>{signal?.sl}</span>
        <span>{signal?.entry}</span>
        <span>{signal?.tp}</span>
      </div>

      <style jsx>{`
        @keyframes instPulse {
          0% { transform: scale(0.85); opacity:.7 }
          50% { transform: scale(1.25); opacity:1 }
          100% { transform: scale(0.85); opacity:.7 }
        }
      `}</style>

    </div>
  )
}
