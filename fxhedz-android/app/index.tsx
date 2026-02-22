import React, { useEffect, useState } from "react"
import { View, Button, ActivityIndicator } from "react-native"
import { WebView } from "react-native-webview"
import * as WebBrowser from "expo-web-browser"
import * as Google from "expo-auth-session/providers/google"
import * as SecureStore from "expo-secure-store"
import { v4 as uuidv4 } from "uuid"

WebBrowser.maybeCompleteAuthSession()

const API_BASE = "https://fxhedz.vercel.app"

export default function HomeScreen() {

  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: "314350994918-8vshj6jmsggen1tdiejho7bp912n83iu.apps.googleusercontent.com",
    webClientId: "314350994918-hofgc5ccq4kctiernfr1ms5nns5r7sjs.apps.googleusercontent.com"
  })

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
      await tryRefresh()
    }

    setLoading(false)
  }

  useEffect(() => {
    if (response?.type === "success") {
      const idToken = response.authentication?.idToken
      if (idToken) {
        exchangeTokenWithBackend(idToken)
      }
    }
  }, [response])

  async function getDeviceId() {
    let deviceId = await SecureStore.getItemAsync("deviceId")
    if (!deviceId) {
      deviceId = uuidv4()
      await SecureStore.setItemAsync("deviceId", deviceId)
    }
    return deviceId
  }

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

    const data = await res.json()

    if (!res.ok) return

    await SecureStore.setItemAsync("accessToken", data.accessToken)
    await SecureStore.setItemAsync("refreshToken", data.refreshToken)
    await SecureStore.setItemAsync("email", data.email)
    await SecureStore.setItemAsync("deviceId", deviceId)

    setAccessToken(data.accessToken)
  }

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

  async function logout() {
    await SecureStore.deleteItemAsync("accessToken")
    await SecureStore.deleteItemAsync("refreshToken")
    await SecureStore.deleteItemAsync("email")
    setAccessToken(null)
  }

  if (loading) {
    return (
      <View style={{ flex:1, justifyContent:"center", alignItems:"center" }}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (!accessToken) {
    return (
      <View style={{ flex:1, justifyContent:"center", alignItems:"center" }}>
        <Button
          title="Sign in with Google"
          disabled={!request}
          onPress={() => promptAsync()}
        />
      </View>
    )
  }

  return (
<WebView
  source={{
    uri: API_BASE,
    headers: { Authorization: `Bearer ${accessToken}` }
  }}
  style={{ flex: 1 }}
  onHttpError={async (syntheticEvent) => {
    const { statusCode } = syntheticEvent.nativeEvent

    if (statusCode === 401) {
      const refreshed = await tryRefresh()

      if (refreshed) {
        setAccessToken(await SecureStore.getItemAsync("accessToken"))
      } else {
        await logout()
      }
    }
  }}
/>
  )
}