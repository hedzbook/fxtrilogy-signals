// components/AccessOverlay.tsx

"use client"

import AuthButton from "./AuthButton"

type Props = {
  active: boolean | null
  sessionExists: boolean
  status?: string
  expiry?: string
}

export default function AccessOverlay({
  active,
  sessionExists,
  status
}: Props) {

  // LOADING STATE
  if (active === null) {
    return (
      <OverlayContainer>
        <div className="text-neutral-400 text-sm">
          Verifying access...
        </div>
      </OverlayContainer>
    )
  }

  // ACCESS GRANTED
  if (active === true) {
    return null
  }

  // ACCESS DENIED STATES
  return (
    <OverlayContainer>

      <div className="space-y-4 text-center max-w-sm">

        <div className="text-[10px] uppercase tracking-widest text-neutral-500">
          FXHEDZ LIVE ENGINE
        </div>

        <div className="text-xl font-semibold">
          Access Restricted
        </div>

        {!sessionExists && (
          <>
            <div className="text-neutral-400 text-sm">
              Login to continue your trial or unlock full access.
            </div>
            <AuthButton />
          </>
        )}

        {sessionExists && (
          <>
            <div className="text-neutral-400 text-sm">
              Your subscription has expired.
            </div>

            <a
              href="https://t.me/yourbot"
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-sm rounded-md"
            >
              Upgrade Subscription
            </a>
          </>
        )}

        <div className="text-xs text-neutral-500">
          9 Instruments · Live Orders · Full History
        </div>

      </div>

    </OverlayContainer>
  )
}

/* -------------------------- */

function OverlayContainer({ children }: any) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-neutral-900/95 border border-neutral-800 shadow-2xl p-8 rounded-xl">
        {children}
      </div>
    </div>
  )
}
