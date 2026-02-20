import React, { useEffect, useState } from "react"
import { View, ActivityIndicator } from "react-native"
import { WebView } from "react-native-webview"
import * as Device from "expo-device"
import * as SecureStore from "expo-secure-store"

export default function App() {

  const [deviceId, setDeviceId] = useState<string | null>(null)

  useEffect(() => {
    initDevice()
  }, [])

  async function initDevice() {
    let id = await SecureStore.getItemAsync("fx_device_id")

    if (!id) {
      id = Device.osInternalBuildId + "-" + Date.now()
      await SecureStore.setItemAsync("fx_device_id", id)
    }

    setDeviceId(id)
  }

  if (!deviceId) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  const url =
    `https://fxhedz.vercel.app/?platform=android&device_id=${deviceId}`

  return (
    <WebView
      source={{ uri: url }}
      javaScriptEnabled
      domStorageEnabled
      originWhitelist={["*"]}
      startInLoadingState
    />
  )
}