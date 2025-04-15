import React, { useContext } from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { AuthContext } from "./_contexts/AuthContext";
import { useRouter } from "expo-router";

export default function Home() {
    const { signOut } = useContext(AuthContext);
    const router = useRouter();

    const handleLogout = async () => {
        await signOut();
        router.replace("/login");
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome to PinPoint!</Text>
            <Button title="Logout" onPress={handleLogout} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
    }
});