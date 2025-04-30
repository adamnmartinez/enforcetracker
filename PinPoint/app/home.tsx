import React, { useContext, useEffect, useRef, useState } from "react";
import { View, Text, Button, Alert } from "react-native";
import { TouchableOpacity } from "react-native";
import { AuthContext } from "./_contexts/AuthContext";
import { useRouter } from "expo-router";
import { homeStyle } from "./style";
import MapView, { LatLng, LongPressEvent, Marker, MarkerPressEvent, Region, Camera } from "react-native-maps"
import { Pin } from "./pin";
import { Dropdown } from "react-native-element-dropdown"
import * as Location from 'expo-location';


export default function Home() {
    const { signOut } = useContext(AuthContext);
    const router = useRouter();
    const [markers, setMarkers] = useState<Pin[]>([]);
    
    // States for choice menu (pin or watch zone)
    const [showChoiceMenu, setShowChoiceMenu] = useState<Boolean>(false);

    // States for creating a new pin
    const [showCreator, setShowCreator] = useState<Boolean>(false);
    const [pinCategory, setPinCategory] = useState<string>("");
    const [pinLocation, setPinLocation] = useState<{ latitude: number, longitude: number}>({
        latitude: 0,
        longitude: 0,
    })

    // State for pin inspection.
    const [showInspector, setShowInspector] = useState<Boolean>(false);
    const [inspected, setInspected] = useState<Pin>()
    const [endorsed, setEndorsed] = useState<string[]>([])

    // Map default region. This is changes when a new pin is created, as the map must reload and remain at the last cam location.
    const [mapRegion, setMapRegion] = useState<Region>({
        latitude: 36.974117,
        longitude: -122.030792,
        latitudeDelta: 0.1, 
        longitudeDelta: 0.1,
    })

    // Creator menu dropdown options, "Categories"
    const data = [
        { label: 'Police', value: 'Police' },
        { label: 'Immigration Enforcment', value: 'Immigration Enforcement' },
        { label: 'Parking Enforcement', value: 'Parking Enforcment' },
        { label: 'Robbery', value: 'Robbery' },
        { label: 'Tresspasser', value: 'Tresspassing' },
    ];  

    // Convert category string to CSS Color for display
    const getPinColor = (category: string) => {
        switch(category){
            case "Police":
                return "blue"

            case "Immigration Enforcement":
                return "red"

            case "Parking Enforcment":
                return "yellow"

            case "Robbery":
                return "purple"

            case "Tresspassing":
                return "brown"

            default:
                return ""
        }
    } 

    // TEMPORARY ID TRACKER FOR TESTING, PIN ID GENERATION SHOULD BE HANDLED SEPARATELY
    const [IDTracker, setIDTracker] = useState<number>(0)

    // Method for hiding windows
    const hideAllPopups = () => {
        setShowInspector(false)
        setShowCreator(false)
        setShowChoiceMenu(false)
    }

    // Reference to map to retrieve camera data
    const mapRef = useRef<MapView>(null)
    // Track user location
    const [userLocation, setUserLocation] = useState<LatLng | null>(null);

    const handleLogout = async () => {
        await signOut();
        router.replace("/login");
    };

    // Track user location on load
    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location access is required.');
                return;
            }
            let location = await Location.getCurrentPositionAsync({});
            setUserLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            });
        })();
    }, []);

    const handleMapLongPress = async (event: LongPressEvent) => {
        // Set new pin location
        const mapPoint = event.nativeEvent.coordinate
        setPinLocation(mapPoint)

        // Animate camera movement
        mapRef.current?.getCamera().then((cam) => {
            mapRef.current?.animateCamera({
                center: mapPoint,
                heading: cam.heading,
                pitch: 0,
                zoom: cam.zoom,
                altitude: cam.altitude
            }, { duration: 750 })
        })

        // Set Menus
        hideAllPopups()
        setShowChoiceMenu(true)
    }

    const handleNewPin = async() => {
        // Create new pin object and assign ID
        if (pinCategory == "") {
            Alert.alert("Error", "Please select a category")
            return
        }

        const newPin = new Pin(pinLocation, pinCategory, IDTracker.toString())
        setIDTracker((prev) => prev + 1)

        // Map will be re-rendered on pin creation.
        // Mirror user's map and camera setup at time of creation
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

        // Update markers
        setMarkers((prevMarkers) => {
            const newMarkers = [...prevMarkers, newPin]
            Alert.alert("Pin Created!", `New pin at ${pinLocation.longitude}, ${pinLocation.latitude}`)
            return newMarkers
        })

        setEndorsed((prev) => [...prev, newPin.id])
        newPin.validity = newPin.validity + 1

        // Hide windows
        hideAllPopups()
    }

    const handleInspectData = (id: string, coordinates: LatLng, category: string, validity: number) => {
        setInspected({
            id: id,
            coordinates: coordinates,
            category: category,
            validity: validity
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

        hideAllPopups()
        setShowInspector(true)
    }

    const handleValidate = async (pin_id: string) => {
        if (pin_id !== "") {
            if (!endorsed.includes(pin_id)) {
                setEndorsed((prev) => [...prev, pin_id])

                const marker = markers.find(obj => {
                    return obj.id == pin_id
                })

                if (marker) {
                    marker.validity = marker.validity + 1
                    setInspected(marker)
                }
                
            } else {
                Alert.alert("You have already confirmed this report!")
            }
        }
    }   
    
    const handleUnvalidate = async (pin_id: string) => {
        if (pin_id !== "") {
            if (endorsed.includes(pin_id)) {
                setEndorsed((prev) => prev.filter(item => item != pin_id))

                const marker = markers.find(obj => {
                    return obj.id == pin_id
                })

                if (marker) {
                    marker.validity = marker.validity - 1
                    setInspected(marker)
                }
                
            } else {
                Alert.alert("You cannot unconfirm a report you have not confirmed!")
            }
        }
    }  

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome to PinPoint!</Text>
            <MapView 
                key={markers.length}
                ref={mapRef}
                style={styles.map}
                initialRegion={mapRegion}
                onLongPress={(event) => {handleMapLongPress(event)}}
                onMarkerPress={(event) => {handleMarkerClick(event)}}
                onPress={() => hideAllPopups()}
                showsUserLocation={true}
                followsUserLocation={true}
            >
            {markers.map((data, index) => (
                <Marker 
                    key={index} 
                    pinColor={getPinColor(data.category)}
                    onPress={() => {handleInspectData(data.id, data.coordinates, data.category, data.validity)}} 
                    coordinate={{latitude: data.coordinates.latitude, longitude: data.coordinates.longitude}}
                />
            ))}
            </MapView>
            {showInspector && 
                <View style={styles.popup}>
                    <Text style={styles.popupHeader}>Pin Inspection</Text>
                    <Text style={styles.popupText}>ID: {inspected?.id}</Text>
                    <Text style={styles.popupText}>Category: {inspected?.category}</Text>
                    <Button title={`Confirmations ${inspected?.validity}`} onPress={() => {handleValidate(inspected?.id || "")}}></Button>
                    { inspected && endorsed.includes(inspected.id) &&
                        <Button title={`Unconfirm Report`} onPress={() => {handleUnvalidate(inspected.id)}}></Button>
                    }
                    <Button title="Close" onPress={() => {hideAllPopups()}}/>
                </View>
            }
            {showCreator && 
                <View style={styles.popup}>
                    <View style={{ position: 'relative', alignItems: 'center', marginBottom: 20 , paddingTop: 20 }}>
                        <TouchableOpacity onPress={() => {
                            setShowCreator(false);
                            setShowChoiceMenu(true);
                        }}
                        style={{ position: 'absolute', left: 0 }}
                        >
                            <Text style={{ fontSize: 24}}>←</Text>
                        </TouchableOpacity>
                        <Text style={[styles.popupHeader, { fontSize: 20 }]}>Create a Pin</Text>
                    </View>
                    <Text style={styles.popupText}>{pinLocation.latitude}, </Text>
                    <Text style={styles.popupText}>{pinLocation.longitude}, </Text>
                    <Dropdown
                        style={styles.dropdown}
                        placeholderStyle={styles.popupText}
                        selectedTextStyle={styles.popupText}
                        inputSearchStyle={styles.popupText}
                        data={data}
                        maxHeight={300}
                        labelField="label"
                        valueField="value"
                        placeholder={'Select Category...'}
                        searchPlaceholder="Search..."
                        value={pinCategory}
                        search={false}
                        onChange={item => {
                          setPinCategory(item.value);
                        }}
                        dropdownPosition="top"
                    />
                    <Button title="Create Pin" onPress={() => {handleNewPin()}}/>
                    <Button title="Close" onPress={() => {hideAllPopups()}}/>
                </View>
            }
            {showChoiceMenu &&
                <View style={styles.popup}>
                    <View style={{ position: 'relative', alignItems: 'center', marginBottom: 20 , paddingTop: 20 }}>
                        <Text style={styles.popupHeader}>What would you like?</Text>
                        <Button title="Add Pin" onPress={() => {
                            hideAllPopups()
                            setShowCreator(true)
                            }}/>
                        <Button title="Add Watch Zone" onPress={() => {
                            hideAllPopups()
                            Alert.alert("not yet implemented!")
                            }}/>
                        <Button title="Close" onPress={() => {hideAllPopups()}}/>
                    </View>
                </View>
            }
            <Button title="Center to My Location" onPress={() => {
                if (userLocation && mapRef.current) {
                    mapRef.current.animateCamera({
                        center: userLocation,
                        zoom: 15
                    }, { duration: 750 });
                } else {
                    Alert.alert("Location not available");
                }
            }} />
            <Button title="Logout" onPress={handleLogout} />
        </View>
    );
}

const styles = homeStyle