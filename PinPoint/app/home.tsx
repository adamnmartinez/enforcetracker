import React, { useContext, useRef, useState } from "react";
import { View, Text, Button, StyleSheet, Alert } from "react-native";
import { AuthContext } from "./_contexts/AuthContext";
import { useRouter } from "expo-router";
import { homeStyle } from "./style";
import MapView, { LatLng, LongPressEvent, Marker, MarkerPressEvent, Region, Camera } from "react-native-maps"

export default function Home() {
    const { signOut } = useContext(AuthContext);
    const router = useRouter();
    const [markers, setMarkers] = useState<LatLng[]>([]);
    const [ mapRegion, setMapRegion ] = useState<Region>({
        latitude: 36.974117,
        longitude: -122.030792,
        latitudeDelta: 0.1, 
        longitudeDelta: 0.1,
    })

    const defaultCamera = {
        center: {
            latitude: 36.974117,
            longitude: -122.030792,
        },
        pitch: 0,
        heading: 0,
        altitude: 10000,
        zoom: 6
    }

    const [ cameraConfig, setCameraConfig ] = useState<Camera>(defaultCamera)

    const mapRef = useRef<MapView>(null)

    const handleLogout = async () => {
        await signOut();
        router.replace("/login");
    };

    const handleMapClick = async (event: LongPressEvent) => {
        const mapPoint = event.nativeEvent.coordinate

        setMapRegion({
            latitude: mapPoint.latitude,
            longitude: mapPoint.longitude,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
        })

        mapRef.current?.getCamera().then((cam) => {
            setCameraConfig({
                center: {latitude: mapPoint.latitude, longitude: mapPoint.longitude},
                heading: 0,
                pitch: 0,
                zoom: cam.zoom,
                altitude: cam.altitude
            })
        })

        setMarkers((prevMarkers) => {
            const newMarkers = [...prevMarkers, mapPoint]
            Alert.alert("You created a pin!", `Number of Pins is ${newMarkers.length}`)
            return newMarkers
        })
    }

    const handleMarkerClick = async (event: MarkerPressEvent) => {
        const markerPoint = event.nativeEvent.coordinate

        Alert.alert(`You pressed on a pin at ${markerPoint.latitude}, ${markerPoint.longitude}`)
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome to PinPoint!</Text>
            <MapView 
                key={markers.length}
                ref={mapRef}
                style={styles.map}
                camera={cameraConfig}
                initialRegion={mapRegion}
                onLongPress={(event) => {handleMapClick(event)}}
                onMarkerPress={(event) => {handleMarkerClick(event)}}
            >
            {markers.map((coord, index) => (
                <Marker key={index} coordinate={coord}/>
            ))}
            </MapView>
            <Button title="Logout" onPress={handleLogout} />
        </View>
    );
}

const styles = homeStyle