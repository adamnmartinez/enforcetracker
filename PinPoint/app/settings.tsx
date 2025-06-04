import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  Switch,
  Button,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { AuthContext } from "./_contexts/AuthContext";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useContext(AuthContext);

  // 1) Push‐notification toggle (default = true until we load a stored value)
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);

  // 2) On mount, read the saved setting and update state
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem("notificationsEnabled");
        if (saved !== null) {
          // stored string is either "true" or "false"
          setNotificationsEnabled(saved === "true");
        }
      } catch (e) {
        console.log("Failed to load notificationsEnabled:", e);
      }
    })();
  }, []);

  // 3) Flip state and save to AsyncStorage
  const toggleNotifications = (value: boolean) => {
    setNotificationsEnabled(value);
    AsyncStorage.setItem("notificationsEnabled", value ? "true" : "false");
  };

  // 4) Log‐out handler
  const handleLogout = async () => {
    await signOut();
    router.replace("/login");
  };

  // 5) App version display
  const version =
    Constants.expoConfig?.version ||
    "1.0.0";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.header}>Settings</Text>
      </View>

      {/* Section: Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Push Notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={toggleNotifications}
          />
        </View>
      </View>

      {/* Section: Account / Logout */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Button title="Log Out" onPress={handleLogout} />
      </View>

      {/* Section: About / Version */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.row}>
          <Text style={styles.label}>App Version</Text>
          <Text style={styles.value}>{version}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 0,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  section: {
    marginBottom: 32,
    marginLeft: 20,
    marginRight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  label: {
    fontSize: 16,
  },
  value: {
    fontSize: 16,
    color: "#555",
  },
});