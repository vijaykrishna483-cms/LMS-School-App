import React from "react";
import { SafeAreaView, StatusBar } from "react-native";
import NotificationsScreen from "./screens/NotificationsScreen";

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f2f2f2" }}>
      <StatusBar barStyle="light-content" />
      <NotificationsScreen />
    </SafeAreaView>
  );
}
