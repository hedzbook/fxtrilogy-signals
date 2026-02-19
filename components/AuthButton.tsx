"use client"

import { signIn, signOut, useSession } from "next-auth/react"

function getDeviceId() {
  let id = localStorage.getItem("fxhedz_device_id")

  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem("fxhedz_device_id", id)
  }

  return id
}

export default function AuthButton() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="text-neutral-400 text-sm">
        Loading...
      </div>
    )
  }

  if (!session) {
    return (
      <button
        onClick={() => {
          const deviceId = getDeviceId()

          // store device id in cookie for server access
          document.cookie = `fx_device=${deviceId}; path=/; max-age=31536000`

          signIn("google")
        }}
        className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-sm rounded-md"
      >
        Login with Google
      </button>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-neutral-300">
        {session.user?.email}
      </span>
      <button
        onClick={() => signOut()}
        className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-sm rounded-md"
      >
        Logout
      </button>
    </div>
  )
}
