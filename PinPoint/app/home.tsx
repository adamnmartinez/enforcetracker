import React, { useContext, useRef, useState } from "react";
import { View, Text, Button, Alert } from "react-native";
import { AuthContext } from "./_contexts/AuthContext";
import { useRouter } from "expo-router";
import { homeStyle } from "./style";
import MapView, { LatLng, LongPressEvent, Marker, MarkerPressEvent, Region, Camera } from "react-native-maps"
import { Pin } from "./pin";

export default function Home() {
    const { signOut } = useContext(AuthContext);
    const router = useRouter();
    const [markers, setMarkers] = useState<Pin[]>([]);
    const [showInspector, setShowInspector] = useState<Boolean>(false);
    const [inspectID, setInspectID] = useState<string>("")
    const [mapRegion, setMapRegion] = useState<Region>({
        latitude: 36.974117,
        longitude: -122.030792,
        latitudeDelta: 0.1, 
        longitudeDelta: 0.1,
    })

    // TEMPORARY ID TRACKER FOR TESTING, PIN ID GENERATION SHOULD BE HANDLED SERVER SIDE
    const [IDTracker, setIDTracker] = useState<number>(0)

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

    const [cameraConfig, setCameraConfig] = useState<Camera>(defaultCamera)

    const mapRef = useRef<MapView>(null)

    const handleLogout = async () => {
        await signOut();
        router.replace("/login");
    };

    const handleMapLongPress = async (event: LongPressEvent) => {
        const mapPoint = event.nativeEvent.coordinate

        // TODO: CREATE MENU TO SELECT CATEGORY, UPLOAD PIN AND AUXILLARY DATA (time of report, location) TO DB

        setShowInspector(false)

        const newPin = new Pin(mapPoint.latitude, mapPoint.longitude, "Not Implemented", IDTracker.toString())
        setIDTracker((prev) => prev + 1)

        setMapRegion({
            latitude: mapPoint.latitude,
            longitude: mapPoint.longitude,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
        })

        mapRef.current?.getCamera().then((cam) => {
            mapRef.current?.animateCamera({
                center: {latitude: mapPoint.latitude, longitude: mapPoint.longitude},
                heading: cam.heading,
                pitch: 0,
                zoom: cam.zoom,
                altitude: cam.altitude
            }, { duration: 750 })
        })

        setMarkers((prevMarkers) => {
            const newMarkers = [...prevMarkers, newPin]
            Alert.alert("Pin Created!", `New pin at ${mapPoint.longitude}, ${mapPoint.latitude}`)
            return newMarkers
        })
    }

    const handleMarkerClick = async (event: MarkerPressEvent) => {
        const markerPoint = event.nativeEvent.coordinate

        mapRef.current?.getCamera().then((cam) => {
            mapRef.current?.animateCamera({
                center: {latitude: markerPoint.latitude, longitude: markerPoint.longitude},
                heading: cam.heading,
                pitch: 0,
                zoom: cam.zoom,
                altitude: cam.altitude
            }, { duration: 750 })
        })

        // TODO: GET PIN DATA FROM DB USING ID

        setShowInspector(true)
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
                onLongPress={(event) => {handleMapLongPress(event)}}
                onMarkerPress={(event) => {handleMarkerClick(event)}}
                onPress={() => setShowInspector(false)}
            >
            {markers.map((data, index) => (
                <Marker key={index} onPress={() => {setInspectID(data.id)}} coordinate={{latitude: data.coordinates.latitude, longitude: data.coordinates.longitude}}/>
            ))}
            </MapView>
            {showInspector && 
                <View style={styles.popup}>
                    <Text style={styles.popupHeader}>Pin Inspection</Text>
                    <Text style={styles.popupText}>ID: {inspectID}</Text>
                    <Button title="Close" onPress={() => {setShowInspector(false)}}/>
                </View>
            }
            <Button title="Logout" onPress={handleLogout} />
        </View>
    );
}

const styles = homeStyle