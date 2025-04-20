import React, { useContext, useRef, useState } from "react";
import { View, Text, Button, Alert } from "react-native";
import { AuthContext } from "./_contexts/AuthContext";
import { useRouter } from "expo-router";
import { homeStyle } from "./style";
import MapView, { LatLng, LongPressEvent, Marker, MarkerPressEvent, Region, Camera } from "react-native-maps"
import { Pin } from "./pin";
import { Picker } from '@react-native-picker/picker';

export default function Home() {
    const { signOut } = useContext(AuthContext);
    const router = useRouter();
    const [markers, setMarkers] = useState<Pin[]>([]);
    
    // States for creating a new pin
    const [showCreator, setShowCreator] = useState<Boolean>(false);
    const [pinCategory, setPinCategory] = useState<string>("");
    const [pinLocation, setPinLocation] = useState<{ latitude: number, longitude: number}>({
        latitude: 0,
        longitude: 0,
    })

    // State for pin inspection.
    const [showInspector, setShowInspector] = useState<Boolean>(false);
    const [inspectID, setInspectID] = useState<string>("")

    // Map default region. This is changes when a new pin is created, as the map must reload and remain at the last cam location.
    const [mapRegion, setMapRegion] = useState<Region>({
        latitude: 36.974117,
        longitude: -122.030792,
        latitudeDelta: 0.1, 
        longitudeDelta: 0.1,
    })

    // TEMPORARY ID TRACKER FOR TESTING, PIN ID GENERATION SHOULD BE HANDLED SEPARATELY
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

        // Prepare to create pin, save location and reveal creator window.

        setPinLocation(mapPoint)

        mapRef.current?.getCamera().then((cam) => {
            mapRef.current?.animateCamera({
                center: mapPoint,
                heading: cam.heading,
                pitch: 0,
                zoom: cam.zoom,
                altitude: cam.altitude
            }, { duration: 750 })
        })

        setShowInspector(false)
        setShowCreator(true)
    }

    const handleCreatePin = async() => {
        const newPin = new Pin(pinLocation, pinCategory, IDTracker.toString())
        setIDTracker((prev) => prev + 1)

        setMapRegion({
            latitude: pinLocation.latitude,
            longitude: pinLocation.longitude,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
        })

        mapRef.current?.getCamera().then((cam) => {
            mapRef.current?.animateCamera({
                center: pinLocation,
                heading: cam.heading,
                pitch: 0,
                zoom: cam.zoom,
                altitude: cam.altitude
            }, { duration: 750 })
        })

        setMarkers((prevMarkers) => {
            const newMarkers = [...prevMarkers, newPin]
            Alert.alert("Pin Created!", `New pin at ${pinLocation.longitude}, ${pinLocation.latitude}`)
            return newMarkers
        })

        setShowCreator(false)
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

        setShowCreator(false)
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
                onPress={() => {
                    setShowInspector(false)
                    setShowCreator(false)
                }}
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
            {showCreator && 
                <View style={styles.popup}>
                    <Text style={styles.popupHeader}>Create a Pin</Text>
                    <Text style={styles.popupText}>{pinLocation.latitude}, </Text>
                    <Text style={styles.popupText}>{pinLocation.longitude}, </Text>
                    <Button title="Create Pin" onPress={() => {handleCreatePin()}}/>
                    <Button title="Close" onPress={() => {setShowCreator(false)}}/>
                </View>
            }
            <Button title="Logout" onPress={handleLogout} />
        </View>
    );
}

const styles = homeStyle