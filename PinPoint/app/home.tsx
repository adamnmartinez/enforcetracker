import React, { useContext, useState } from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { AuthContext } from "./_contexts/AuthContext";
import { useRouter } from "expo-router";
import { homeStyle } from "./style";
import MapView, { Marker } from "react-native-maps"

export default function Home() {
    const { signOut } = useContext(AuthContext);
    const router = useRouter();
    const [ markers, setMarkers ] = useState([
        // This array can contain all the pins we get from the database
        <Marker
            coordinate={{
                latitude: 36.974117,
                longitude: -122.030792,
            }}
            title="Test Marker"
            description="Welcome to Santa Cruz!"
        />
    ])

    const handleLogout = async () => {
        await signOut();
        router.replace("/login");
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome to PinPoint!</Text>
            <MapView 
                style={styles.map}
                region={{
                    latitude: 36.974117,
                    longitude: -122.030792,
                    latitudeDelta: 0.1,
                    longitudeDelta: 0.1,
                }}
            >
            {markers}
            </MapView>
            <Button title="Logout" onPress={handleLogout} />
        </View>
    );
}

const styles = homeStyle