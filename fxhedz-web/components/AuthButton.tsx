"use client"

import { signIn, signOut, useSession } from "next-auth/react"
import { ensureDeviceIdentity } from "@/lib/device"

export default function AuthButton() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 border-2 border-neutral-600 border-t-blue-500 rounded-full animate-spin" />
        <span className="text-[9px] text-neutral-500 uppercase tracking-wider font-bold">
          Syncing...
        </span>
      </div>
    )
  }

  if (!session) {
    return (
      <button
        onClick={() => {
          ensureDeviceIdentity()
          signIn("google")
        }}
        className="
          flex items-center justify-center gap-2
          w-full max-w-[200px]
          py-1.5 px-3
          bg-white hover:bg-neutral-50
          text-neutral-700
          text-[11px] font-semibold
          rounded-md border border-neutral-300
          shadow-sm transition
          active:scale-[0.98]
        "
      >
        <GoogleIcon />
        <span>Sign in with Google</span>
      </button>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <div className="px-2 py-1 bg-neutral-800/50 rounded-full border border-neutral-700/50">
        <span className="text-[9px] text-neutral-400 font-mono truncate max-w-[160px] block">
          {session.user?.email}
        </span>
      </div>
      <button
        onClick={() => signOut()}
        className="text-[9px] font-bold uppercase text-red-500 hover:text-red-400 transition"
      >
        Sign Out
      </button>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
      <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.712s.102-1.173.282-1.712V4.956H.957a8.996 8.996 0 000 8.088l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.956l3.007 2.332C4.672 5.164 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  )
}