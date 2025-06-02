import React, { useState, useContext } from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet } from "react-native";
import { AuthContext } from "./_contexts/AuthContext";
import { useRouter } from "expo-router";
import { authStyle, placeholderColor } from "./style";
import {addEntryValidity} from "./validity";
import { HOST } from "./server";

export default function Signup() {
    const { signUp } = useContext(AuthContext);
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [username, setUsername] = useState("")

    const handleSignup = async () => {
        try {
            const response = await fetch(HOST + "/api/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, username, password }),
            });
            const data = await response.json();
            if (response.status == 201) {
                await signUp(data.token);
            } else if (response.status == 400) {
                Alert.alert("Bad Request", data.message);
            } else if (response.status == 429) {
                Alert.alert("Slow Down!", "You have sent too many requests, please try again later.");
            } else {
                Alert.alert("Authentication Failed", data.message || "An unexpected error occured.")
            }
        } catch (error) {
            Alert.alert("Network Error", "An error occurred with the server. Please try again.");
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>PinPoint</Text>
            <Text style={styles.title}>Sign Up</Text>
            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />
            <TextInput
                style={styles.input}
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
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
            <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholderTextColor={placeholderColor}
                secureTextEntry
            />
            <Button title="Sign Up" onPress={() => {
                confirmPassword == password ? handleSignup() : Alert.alert("Error", "Passwords don't match")
            }} />
            <Button title="Already have an account? Login" onPress={() => router.push("/login")} />
        </View>
    );
}

const styles = authStyle
