import { Slot, useRouter } from "expo-router";
import React, { useContext, useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";
import * as Notifications from "expo-notifications";
import { AuthProvider, AuthContext } from "./_contexts/AuthContext";

// Show notifications in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function RootLayout() {
  const { userToken, isLoading } = useContext(AuthContext);
  const router = useRouter();

  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Auth redirect
    if (!isLoading && !userToken) {
      router.replace("/login");
    }

    // 🔔 Notification listeners
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log("📥 Notification received:", notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("🔁 Notification tap response:", response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, [userToken, isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return <Slot />;
}

export default function App() {
  return (
    <AuthProvider>
      <RootLayout />
    </AuthProvider>
  );
}
