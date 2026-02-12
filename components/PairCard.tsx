"use client"

type Props = {
  pair: string
  direction?: "BUY" | "SELL"
  signal?: any
  onToggle: () => void
}

export default function PairCard({
  pair,
  onToggle,
  direction,
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
        className="p-4 flex justify-between items-center cursor-pointer"
      >
        <div>
          <div className="font-semibold">{pair}</div>
          <div className="text-sm text-neutral-400">
            H1 Trend Strong
          </div>
        </div>

        <div className={`font-bold ${
          dir === "BUY"
            ? "text-green-400"
            : dir === "SELL"
            ? "text-red-400"
            : "text-neutral-500"
        }`}>
          {dir}
        </div>
      </div>

    </div>
  )
}
