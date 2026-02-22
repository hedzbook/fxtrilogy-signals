import React, { useEffect, useState } from "react"
import { View, ActivityIndicator } from "react-native"
import { WebView } from "react-native-webview"
import * as WebBrowser from "expo-web-browser"
import * as Google from "expo-auth-session/providers/google"
import * as SecureStore from "expo-secure-store"

WebBrowser.maybeCompleteAuthSession()

const API_BASE = "https://fxhedz.vercel.app"

export default function HomeScreen() {

  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: "314350994918-8vshj6jmsggen1tdiejho7bp912n83iu.apps.googleusercontent.com",
    webClientId: "314350994918-hofgc5ccq4kctiernfr1ms5nns5r7sjs.apps.googleusercontent.com"
  })

  // ===============================
  // INITIALIZE
  // ===============================
  useEffect(() => {
    initialize()
  }, [])

  async function initialize() {
    const storedAccess = await SecureStore.getItemAsync("accessToken")
    const storedRefresh = await SecureStore.getItemAsync("refreshToken")
    const storedEmail = await SecureStore.getItemAsync("email")

    if (storedAccess) {
      setAccessToken(storedAccess)
      setLoading(false)
      return
    }

    if (storedRefresh && storedEmail) {
      const refreshed = await tryRefresh()
      if (refreshed) {
        const newAccess = await SecureStore.getItemAsync("accessToken")
        setAccessToken(newAccess ?? null)
      }
    }

    setLoading(false)
  }

  // ===============================
  // GOOGLE RESPONSE HANDLER
  // ===============================
  useEffect(() => {
    if (response?.type === "success") {
      const idToken = response.authentication?.idToken
      if (idToken) {
        exchangeTokenWithBackend(idToken)
      }
    }
  }, [response])

  // ===============================
  // DEVICE ID
  // ===============================
  async function getDeviceId(): Promise<string> {
    let deviceId = await SecureStore.getItemAsync("deviceId")

    if (!deviceId) {
      deviceId = crypto.randomUUID()
      await SecureStore.setItemAsync("deviceId", deviceId)
    }

    return deviceId
  }

  // ===============================
  // EXCHANGE GOOGLE TOKEN
  // ===============================
  async function exchangeTokenWithBackend(idToken: string) {
    const deviceId = await getDeviceId()

    const res = await fetch(`${API_BASE}/api/native-auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idToken,
        deviceId
      })
    })

    if (!res.ok) return

    const data = await res.json()

    await SecureStore.setItemAsync("accessToken", data.accessToken)
    await SecureStore.setItemAsync("refreshToken", data.refreshToken)
    await SecureStore.setItemAsync("email", data.email)

    setAccessToken(data.accessToken)
  }

  // ===============================
  // SILENT REFRESH
  // ===============================
  async function tryRefresh(): Promise<boolean> {
    const refreshToken = await SecureStore.getItemAsync("refreshToken")
    const email = await SecureStore.getItemAsync("email")
    const deviceId = await SecureStore.getItemAsync("deviceId")

    if (!refreshToken || !email || !deviceId) return false

    const res = await fetch(`${API_BASE}/api/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        refreshToken,
        email,
        deviceId
      })
    })

    if (!res.ok) return false

    const data = await res.json()

    await SecureStore.setItemAsync("accessToken", data.accessToken)
    setAccessToken(data.accessToken)

    return true
  }

  // ===============================
  // LOGOUT
  // ===============================
  async function logout() {
    await SecureStore.deleteItemAsync("accessToken")
    await SecureStore.deleteItemAsync("refreshToken")
    await SecureStore.deleteItemAsync("email")
    setAccessToken(null)
  }

  // ===============================
  // LOADING
  // ===============================
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  // ===============================
  // ALWAYS LOAD WEBVIEW
  // ===============================
  return (
<WebView
  key={accessToken ?? "guest"}
  source={{
    uri: API_BASE,
    headers: accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : {}
  }}
  style={{ flex: 1 }}

  onMessage={async (event) => {

    const message = event.nativeEvent.data

    if (message === "LOGIN_REQUEST") {
      promptAsync()
    }

    if (message === "LOGOUT_REQUEST") {
      await logout()
    }
  }}

  onHttpError={async (syntheticEvent) => {

    const { statusCode } = syntheticEvent.nativeEvent

    if (statusCode === 401) {

      const refreshed = await tryRefresh()

      if (!refreshed) {
        promptAsync()
      }
    }
  }}
/>
  )
}