// components/VerticalSymbolButton.tsx

"use client"

type Props = {
  pair: string
  active?: boolean
  onClick: () => void
}

export default function VerticalSymbolButton({
  pair,
  active = false,
  onClick
}: Props) {

  const letters = pair.split("")

  return (
    <button
      onClick={onClick}
      className={`
        h-full w-full
        flex flex-col items-center justify-center
        border border-neutral-800
        text-[clamp(7px,0.9vh,12px)]
        tracking-widest
        rounded-none
        ${active
          ? "bg-neutral-900 text-white border-sky-400"
          : "bg-neutral-950 text-neutral-500 hover:bg-neutral-900"
        }
      `}
    >
      {letters.map((l, i) => (
        <span
          key={i}
          className="leading-none"
        >
          {l}
        </span>
      ))}
    </button>
  )
}
