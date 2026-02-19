// components/DashboardControlBar.tsx

"use client"

import React from "react"

type ViewMode = "MIN" | "MID" | "MAX"

export default function DashboardControlBar({
  viewMode,
  onChangeView,
  onMenu
}: {
  viewMode: ViewMode
  onChangeView: (mode: ViewMode) => void
  onMenu?: () => void
}) {

  function Btn({
    label,
    active,
    onClick
  }: {
    label: string
    active?: boolean
    onClick: () => void
  }) {
    return (
      <button
        onClick={onClick}
        className={`px-4 py-2 text-[clamp(10px,1.4vw,14px)] font-semibold transition-all duration-200
        ${active
            ? "text-white bg-neutral-800"
            : "text-neutral-400 hover:text-neutral-200"
          }`}
      >
        {label}
      </button>
    )
  }

  return (
    <div
      className="fixed bottom-0 left-0 w-full z-50
                 bg-gradient-to-t from-black to-neutral-900
                 border-t border-neutral-800
                 rounded-t-2xl
                 backdrop-blur-xl"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)"
      }}
    >
      <div className="flex items-center justify-between px-4 py-3">

        {/* LEFT SIDE — VIEW CONTROLS */}
        <div className="flex items-center gap-2">

          <Btn
            label="MIN"
            active={viewMode === "MIN"}
            onClick={() => onChangeView("MIN")}
          />

          <Btn
            label="MID"
            active={viewMode === "MID"}
            onClick={() => onChangeView("MID")}
          />

          <Btn
            label="MAX"
            active={viewMode === "MAX"}
            onClick={() => onChangeView("MAX")}
          />

        </div>

        {/* RIGHT SIDE — MENU */}
        <button
          onClick={onMenu}
          className="w-9 h-9 flex items-center justify-center
                     rounded-lg bg-neutral-800
                     text-neutral-300 hover:text-white
                     transition-all duration-200"
        >
          ☰
        </button>

      </div>
    </div>
  )
}
