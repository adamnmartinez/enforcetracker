import { Slot, useRouter } from "expo-router";
import React, { useContext, useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, AuthContext } from "./_contexts/AuthContext";

function RootLayout() {
  const { userToken, isLoading } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !userToken) {
      router.replace("/login");
    }
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