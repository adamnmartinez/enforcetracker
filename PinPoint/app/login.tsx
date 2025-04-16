import React, {useState, useContext} from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet } from "react-native";
import { AuthContext } from "./_contexts/AuthContext";
import { useRouter } from "expo-router";
import { authStyle, placeholderColor } from "./style";

export default function Login() {
    const { signIn } = useContext(AuthContext);
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async () => {
        try {
            const response = await fetch("https://backend.com/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (response.ok) {
                await signIn(data.token);
                router.replace("/home");
            } else {
                Alert.alert("Login Failed", data.message || "Invalid credentials");
            }
        } catch (error) {
            Alert.alert("Network Error", "An error occurred. Please try again.");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>PinPoint</Text>

            <Text style={styles.title}>Login</Text>
            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                placeholderTextColor={placeholderColor}
                autoCapitalize="none"
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                placeholderTextColor={placeholderColor}
                secureTextEntry
            />
            <Button title="Login" onPress={handleLogin} />
            <Button title="Don't have an account? Sign Up" onPress={() => router.push("/signup")} />
        </View>
    );
}

const styles = authStyle