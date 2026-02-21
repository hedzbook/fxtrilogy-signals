"use client"

import { signOut } from "next-auth/react"
import AuthButton from "./AuthButton"

type Props = {
  active: boolean | null
  sessionExists: boolean
  status?: string | null
  expiry?: string | null
  blocked?: boolean
}

export default function AccessOverlay({
  active,
  sessionExists,
  status,
  expiry,
  blocked
}: Props) {

  if (active === true) return null

  return (
    <OverlayContainer>
      <Panel>
        {/* 1️⃣ LOADING STATE */}
        {active === null && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-5 h-5 border-2 border-neutral-700 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-[10px] font-bold text-neutral-500 tracking-[0.2em]">VERIFYING</p>
          </div>
        )}

        {/* 2️⃣ DEVICE BLOCKED */}
        {blocked && (
          <>
            <Header />
            <Title>Device Restricted</Title>
            <Description>
              Maximum 2 terminals allowed.
            </Description>

            <div className="space-y-2 w-full">

              <button
                onClick={async () => {
                  const res = await fetch("/api/reset-devices", {
                    method: "POST"
                  })

                  const data = await res.json()

                  if (data?.success) {
                    await signOut({ callbackUrl: "/" })
                  }
                }}
                className="w-full flex justify-center items-center py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-bold rounded-md transition-all shadow-md active:scale-[0.98]"
              >
                Logout of All Devices
              </button>

              <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
                <span className="text-[11px] text-neutral-500 font-mono">DEVICE LIMIT</span>
                <GoogleLogoutButton />
              </div>
            </div>
          </>
        )}

        {/* 3️⃣ LOGIN REQUIRED */}
        {(!sessionExists || active === false) && !blocked && (
          <>
            <Header />
            <Title>Institutional Sign-in</Title>
            <Description>
              Sign in to activate your 14-day terminal trial.
            </Description>
            <div className="w-full flex justify-center">
              <AuthButton />
            </div>
          </>
        )}

        {/* 4️⃣ LIVE EXPIRED */}
        {sessionExists && active === false && !blocked && (
          <>
            <Header />
            <Title>Trial Concluded</Title>
            <Description>
              Your institutional trial has ended. Please upgrade for continued access.
            </Description>
            <div className="space-y-2 w-full flex flex-col items-center">
              {/* FIXED: Direct Tailwind classes for the blue button */}
              <a
                href="https://t.me/fxhedzbot"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex justify-center items-center py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-xs sm:text-sm font-bold rounded-md transition-all shadow-md active:scale-[0.98] cursor-pointer"
              >
                Get LIVE+
              </a>
              <div className="w-full pt-2 border-t border-neutral-800 mt-2 flex justify-center">
                <GoogleLogoutButton />
              </div>
            </div>
          </>
        )}
      </Panel>
    </OverlayContainer>
  )
}

/* --- Styled Sub-Components --- */

function OverlayContainer({ children }: any) {
  return (
    <div className="
      fixed inset-0 z-[999]
      flex items-end justify-center
      pb-[clamp(20px,3vh,40px)]
      px-4
      pointer-events-none
    ">
      {children}
    </div>
  )
}

function Panel({ children }: any) {
  return (
    <div className="
      w-full max-w-[320px]
      bg-[#0d0d0d]
      border border-neutral-800
      rounded-xl
      shadow-[0_10px_40px_rgba(0,0,0,0.7)]
      px-5 py-6
      flex flex-col items-center text-center
      pointer-events-auto
    ">
      {children}
    </div>
  )
}

function Header() {
  return (
    <div className="text-[10px] tracking-[0.3em] text-blue-500 font-black mb-4 uppercase">
      FXHEDZ <span className="text-white">LIVE</span>
    </div>
  )
}

function Title({ children }: any) {
  return <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2">{children}</h2>
}

function Description({ children }: any) {
  return <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed mb-4">{children}</p>
}

function GoogleLogoutButton() {
  return (
    <button
      onClick={() => signOut()}
      className="flex items-center justify-center py-1.5 px-4 bg-white hover:bg-neutral-100 text-neutral-800 font-bold text-[10px] rounded border border-neutral-200 shadow-sm transition-all uppercase"
    >
      Logout
    </button>
  )
}