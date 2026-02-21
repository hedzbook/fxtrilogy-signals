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

  if (active === null) {
    return (
      <OverlayContainer>
        <Panel>
          <div className="flex flex-col items-center gap-2">
            <div className="w-4 h-4 border-2 border-neutral-700 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-[9px] font-bold text-neutral-500 tracking-[0.15em]">
              VERIFYING
            </p>
          </div>
        </Panel>
      </OverlayContainer>
    )
  }

  if (active === true) return null

  return (
    <OverlayContainer>
      <Panel>

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
                  const res = await fetch("/api/reset-devices", { method: "POST" })
                  const data = await res.json()
                  if (data?.success) {
                    await signOut({ callbackUrl: "/" })
                  }
                }}
                className="w-full py-2 bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold rounded-md transition active:scale-[0.98]"
              >
                Logout of All Devices
              </button>

              <div className="pt-2 border-t border-neutral-800 flex justify-center">
                <GoogleLogoutButton />
              </div>
            </div>
          </>
        )}

        {!sessionExists && !blocked && (
          <>
            <Header />
            <Title>Institutional Sign-in</Title>
            <Description>
              Activate your 14-day terminal trial.
            </Description>
            <div className="w-full flex justify-center">
              <AuthButton />
            </div>
          </>
        )}

        {sessionExists && active === false && !blocked && (
          <>
            <Header />
            <Title>Trial Concluded</Title>
            <Description>
              Upgrade for continued access.
            </Description>

            <div className="space-y-2 w-full flex flex-col items-center">

              <a
                href="https://t.me/fxhedzbot"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white text-[11px] font-bold rounded-md transition active:scale-[0.98]"
              >
                Get LIVE+
              </a>

              <div className="w-full pt-2 border-t border-neutral-800 flex justify-center">
                <GoogleLogoutButton />
              </div>
            </div>
          </>
        )}

      </Panel>
    </OverlayContainer>
  )
}

/* ---------- Layout ---------- */

function OverlayContainer({ children }: any) {
  return (
    <div className="
      fixed inset-x-0 bottom-0 z-[999]
      flex justify-center
      pb-[clamp(70px,8vh,110px)]
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
      w-full max-w-[clamp(220px,70vw,300px)]
      bg-[#0d0d0d]
      border border-neutral-800
      rounded-lg
      shadow-[0_8px_30px_rgba(0,0,0,0.7)]
      px-4 py-4
      flex flex-col items-center text-center
      gap-2
      pointer-events-auto
    ">
      {children}
    </div>
  )
}

function Header() {
  return (
    <div className="text-[9px] tracking-[0.25em] text-blue-500 font-black uppercase">
      FXHEDZ <span className="text-white">LIVE</span>
    </div>
  )
}

function Title({ children }: any) {
  return (
    <h2 className="text-[clamp(14px,2.8vw,18px)] font-semibold text-white leading-tight">
      {children}
    </h2>
  )
}

function Description({ children }: any) {
  return (
    <p className="text-[10px] sm:text-[11px] text-neutral-400 leading-snug">
      {children}
    </p>
  )
}

function GoogleLogoutButton() {
  return (
    <button
      onClick={() => signOut()}
      className="py-1 px-3 bg-white hover:bg-neutral-100 text-neutral-800 font-bold text-[9px] rounded border border-neutral-200 transition uppercase"
    >
      Logout
    </button>
  )
}