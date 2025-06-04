import React, {useState, useContext} from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet, Image } from "react-native";
import { AuthContext } from "./_contexts/AuthContext";
import { useRouter } from "expo-router";
import { HOST } from "./server";
import { authStyle, placeholderColor } from "./style";
import * as Notifications from "expo-notifications";
import PinPointLogo from "../assets/images/pinpoint_logo.png";

export default function Login() {
    const { signIn } = useContext(AuthContext);
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async () => {
        try {
            const { data: expotoken } = await Notifications.getExpoPushTokenAsync()
            const response = await fetch(HOST + "/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password, expotoken }),
            });
            
            const data = await response.json();
            if (response.status == 200) {
                await signIn(data.token);     
                router.replace("/home");
            } else if (response.status == 403){
                Alert.alert(
                    "Login Failed", 
                    "Your account has not been activated. Would you like to re-send the confirmation email?",
                     [
                        {
                            text: "Yes",
                            onPress: async () => {
                                try {
                                    await fetch(HOST + "/api/regenerate-vericode", {
                                        method: "POST",
                                        headers: {
                                            "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({ uid: data.uid, email: data.email }),
                                    })
                                } catch (e) {
                                    //Alert.alert("Error", "An unexpected error occured, please try again later.")
                                    Alert.alert("Error", e?.toString())
                                } finally {
                                    Alert.alert("Code Sent", "Please check your email to complete account registration.")
                                }
                                
                            },
                        },
                        {
                            text: "No",
                            onPress: () => {
                                return;
                            },
                        },
                        ],
                )
            } else if (response.status == 401) {
                Alert.alert("Login Failed", "Your username or password is incorrect.")
            } else if (response.status == 400) {
                Alert.alert("Bad Request", data.message);
            } else if (response.status == 429) {
                Alert.alert("Slow Down!", "You have sent too many requests, please try again later.");
            } else {
                Alert.alert("Login Failed", data.message || "Unexpected error, please try again later.");
            }
        } catch (error) {
            //Alert.alert("Network Error", "An error occurred. Please try again.");
            Alert.alert("Error", error?.toString())
        }
    };

    return (
        <View style={styles.container}>
            <Image source={PinPointLogo} style={styles.logo} resizeMode="contain" />

            <Text style={styles.title}>Login</Text>
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
            <Button title="Login" onPress={handleLogin} />
            <Button title="Don't have an account? Sign Up" onPress={() => router.push("/signup")} />
            <Button title="Test Home Page" onPress={() => router.push("/home")} />
        </View>
    );
}

const styles = authStyle;