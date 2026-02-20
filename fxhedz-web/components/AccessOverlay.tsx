"use client"

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

  // 1️⃣ LOADING
  if (active === null) {
    return (
      <OverlayContainer>
        <Panel>
          <p className="text-sm md:text-base text-neutral-500">
            Verifying access...
          </p>
        </Panel>
      </OverlayContainer>
    )
  }

  // 2️⃣ ACCESS GRANTED
  if (active === true) return null

  // 3️⃣ DEVICE BLOCKED
  if (blocked) {
    return (
      <OverlayContainer>
        <Panel>

          <Header />
          <Title>Device Not Authorized</Title>

          <Description>
            This device has already consumed a trial or is not permitted.
          </Description>

          <a
            href="https://t.me/fxhedzbot"
            className="institution-btn-secondary"
          >
            Contact Support
          </a>

          <AuthButton />

        </Panel>
      </OverlayContainer>
    )
  }

  // 4️⃣ LOGIN REQUIRED
  if (!sessionExists) {
    return (
      <OverlayContainer>
        <Panel>

          <Header />
          <Title>Login Required</Title>

          <Description>
            Sign in with Google to unlock 14-day free trial.
          </Description>

          <AuthButton />

        </Panel>
      </OverlayContainer>
    )
  }

  // 5️⃣ FREE EXPIRED
  if (sessionExists && status === "free") {

    const formattedExpiry = expiry
      ? new Date(expiry).toLocaleDateString()
      : null

    return (
      <OverlayContainer>
        <Panel>

          <Header />
          <Title>Free Access Ended</Title>

          <Description>
            {formattedExpiry
              ? `Your free access expired on ${formattedExpiry}.`
              : "Your free access has expired."}
          </Description>

          <a
            href="https://t.me/fxhedzbot"
            className="institution-btn-primary"
          >
            Upgrade Subscription
          </a>

          <AuthButton />

        </Panel>
      </OverlayContainer>
    )
  }

  // 6️⃣ FALLBACK
  return (
    <OverlayContainer>
      <Panel>
        <p className="text-sm md:text-base text-neutral-500">
          Access restricted.
        </p>
      </Panel>
    </OverlayContainer>
  )
}

/* -------------------------- */

function OverlayContainer({ children }: any) {
  return (
    <div className="
      absolute inset-0 z-50
      flex items-center justify-center
      pointer-events-auto
    ">
      {children}
    </div>
  )
}

function Panel({ children }: any) {
  return (
    <div className="
      w-[90%] max-w-[520px]
      bg-neutral-900
      border border-neutral-800
      rounded-xl
      shadow-xl
      px-8 md:px-12
      py-8 md:py-10
      space-y-6
      text-center
    ">
      {children}
    </div>
  )
}

function Header() {
  return (
    <div className="
      text-[10px] md:text-xs
      uppercase
      tracking-[0.3em]
      text-neutral-500
      font-medium
    ">
      FXHEDZ LIVE ENGINE
    </div>
  )
}

function Title({ children }: any) {
  return (
    <h2 className="
      text-lg md:text-2xl lg:text-3xl
      font-semibold
      tracking-tight
      text-white
    ">
      {children}
    </h2>
  )
}

function Description({ children }: any) {
  return (
    <p className="
      text-xs md:text-sm lg:text-base
      text-neutral-400
      leading-relaxed
    ">
      {children}
    </p>
  )
}