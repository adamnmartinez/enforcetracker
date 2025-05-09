import React, { useContext, useEffect, useRef, useState } from "react";
import { TouchableOpacity } from "react-native";
import { View, Text, Button, Alert, Pressable } from "react-native";
import { AuthContext } from "./_contexts/AuthContext";
import { useRouter } from "expo-router";
import { homeStyle } from "./style";
import MapView, { LatLng, LongPressEvent, Marker, MarkerPressEvent, Region, Camera } from "react-native-maps"
import { Pin } from "./pin";
import { Dropdown } from "react-native-element-dropdown"
import * as Location from 'expo-location';
import { HOST } from "./server";

export default function Home() {
    const { userToken, signOut } = useContext(AuthContext);
    const router = useRouter();
    const [markers, setMarkers] = useState<Pin[]>([]);
    
    // States for choice menu (pin or watch zone)
    const [showChoiceMenu, setShowChoiceMenu] = useState<Boolean>(false);
    const [showWatcherMenu, setShowWatcherMenu] = useState<Boolean>(false);
    const [userData, setUserData] = useState<{username: string, id: number}>({
        username: "",
        id: 0,
    })

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
        latitudeDelta: 0.01, 
        longitudeDelta: 0.01,
    })

    // Creator menu dropdown options, "Categories"
    const public_category = [
        { label: 'Police', value: 'Police' },
        { label: 'Immigration Enforcment', value: 'Immigration Enforcement' },
        { label: 'Parking Enforcement', value: 'Parking Enforcment' },
        { label: 'Robbery', value: 'Robbery' },
        { label: 'Tresspasser', value: 'Tresspassing' },
    ];  

    const private_category = [
        { label: 'Home', value: 'Home' },
        { label: 'Car', value: 'Car' },
        { label: 'General', value: 'General'}
    ]

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

    // Fetch Pins from DB
    const fetchPins = () => {
        //Alert.alert("Debug", "Attempting GET to " + HOST + "/api/fetchpins")
        try {
            fetch(HOST + "/api/fetchpins", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                }
            }).then((response) => {
                response.json().then((data) => {
                    if (response.status == 200) {
                        let serverPins: Pin[] = []
                        for (let i = 0; i < data.pins.length; i++) {
                            serverPins = [...serverPins, new Pin (
                                {
                                    latitude: data.pins[i].latitude,
                                    longitude: data.pins[i].longitude,
                                },
                                data.pins[i].category,
                                data.pins[i].pid
                            )]
                        }
                        //Alert.alert("DEBUG", "Got Pins, Updating...")
                        setMarkers(serverPins)
                        //Alert.alert("DEBUG", `${JSON.stringify(markers)}`)
                    } else {
                        Alert.alert("Pin Fetch Error", "We ran into an error communicating with the server (500)")
                    }
                })
            })
        } catch (e) {
            Alert.alert("Error", "An error occured populating the user map...(500)")
        }
        
    }

    const refreshPins = () => { 
        fetchPins() 
    }

    useEffect(() => {
        fetchPins()
        fetchUserData()
    }, [])

    const fetchUserData = async () => {
        try {
            fetch(HOST + "/api/me", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "authorization": userToken || "",
                }
            }).then((response) => {
                response.json().then((data) => {
                    if (response.status == 200) {
                        setUserData({
                            username: data.username, 
                            id: data.id,
                        })
                    } else {
                        Alert.alert("User Fetch Error", "We ran into an error communicating with the server (500)")
                    }
                })
            })
        } catch (e) {
            Alert.alert("Error", "An error occured getting user data...(500)")
        }
    }

    // Fetch Pins from DB
    const uploadPin = (category: string, coordinates: LatLng, author: number) => {
        //Alert.alert("Debug", "Attempting GET to " + HOST + "/api/fetchpins")
        //Alert.alert("Token", SecureStore.getItem("token") || "No token")

        try {
            fetch(HOST + "/api/pushpin", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    category: category,
                    longitude: coordinates.longitude,
                    latitude: coordinates.latitude,
                    author_id: author,
                })
            }).then((response) => {
                response.json().then((data) => {
                    if (response.status == 201) {
                        fetchPins()
                    } else {
                        Alert.alert("Pin Upload Error", "We ran into an error with the server (500)")
                    }
                })
            })
        } catch (e) {
            Alert.alert("Error", e?.toString())
        }
        
    }

    // TEMPORARY ID TRACKER FOR TESTING, PIN ID GENERATION SHOULD BE HANDLED SEPARATELY
    const [IDTracker, setIDTracker] = useState<number>(0)

    // Method for hiding windows
    const hideAllPopups = () => {
        setShowInspector(false)
        setShowWatcherMenu(false)
        setShowCreator(false)
        setShowChoiceMenu(false)
    }

    // Reference to map to retrieve camera data
    const mapRef = useRef<MapView>(null)
    // Track user location
    const [userLocation, setUserLocation] = useState<LatLng | null>(null);
    const [isLoadingLocation, setIsLoadingLocation] = useState(true);

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
            const coords = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            };
            setUserLocation(coords);
            setMapRegion({
                ...coords,
                latitudeDelta: 0.002,
                longitudeDelta: 0.002
            });
            setIsLoadingLocation(false);
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

        uploadPin(pinCategory, pinLocation, userData.id)

        setEndorsed((prev) => [...prev, newPin.id])
        newPin.validity = newPin.validity + 1

        // Hide windows
        hideAllPopups()
        refreshPins()
    }

    const handleNewWatcher = async () => {
        Alert.alert("Watch Zone Created!", `New watcher at ${pinLocation.longitude}, ${pinLocation.latitude}`)
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
        <>
        {isLoadingLocation ? (
            <View style={styles.container}>
                <Text style={styles.title}>Loading location...</Text>
            </View>
        ) : (
            <View style={styles.container}>
                <View style={{ position: 'relative', alignItems: 'center', marginBottom: 20 , paddingTop: 20 }}>
                    <TouchableOpacity onPress={handleLogout}
                    style={{ position: 'absolute', right: 150, top: 20 }}
                    >
                        <Text style={{ fontSize: 24}}>←</Text>
                    </TouchableOpacity>
                </View>
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
                                hideAllPopups();
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
                            data={public_category}
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
                        <View style={
                            {
                                flexDirection: "row",
                                justifyContent: "space-between",
                                gap: 20,
                                marginTop: 10,
                            }
                        }>
                            <Pressable style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]} onPress={handleNewPin}>
                                <Text style={styles.buttonText}>Create</Text>
                            </Pressable>
                            <Pressable style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]} onPress={hideAllPopups}>
                                <Text style={styles.buttonText}>Close</Text>
                            </Pressable>
                        </View>
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
                                setShowWatcherMenu(true)
                                }}/>
                            <Button title="Close" onPress={() => {hideAllPopups()}}/>
                        </View>
                    </View>
                }
                {showWatcherMenu && 
                    <View style={styles.popup}>
                        <View style={{ position: 'relative', alignItems: 'center', marginBottom: 20 , paddingTop: 20 }}>
                            <TouchableOpacity onPress={() => {
                                hideAllPopups()
                                setShowChoiceMenu(true);
                            }}
                            style={{ position: 'absolute', left: 0 }}
                            >
                                <Text style={{ fontSize: 24}}>←</Text>
                            </TouchableOpacity>
                            <Text style={[styles.popupHeader, { fontSize: 20 }]}>Create a Watch Point</Text>
                        </View>
                        <Text style={styles.popupText}>{pinLocation.latitude}, </Text>
                        <Text style={styles.popupText}>{pinLocation.longitude}, </Text>
                        <Dropdown
                            style={styles.dropdown}
                            placeholderStyle={styles.popupText}
                            selectedTextStyle={styles.popupText}
                            inputSearchStyle={styles.popupText}
                            data={private_category}
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
                        <View style={
                            {
                                flexDirection: "row",
                                justifyContent: "space-between",
                                gap: 20,
                                marginTop: 10,
                            }
                        }>
                            <Pressable style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]} onPress={handleNewWatcher}>
                                <Text style={styles.buttonText}>Create</Text>
                            </Pressable>
                            <Pressable style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]} onPress={hideAllPopups}>
                                <Text style={styles.buttonText}>Close</Text>
                            </Pressable>
                        </View>
                    </View>
                }
                <View style={
                    {
                        flexDirection: "row",
                        justifyContent: "space-between",
                        gap: 30,
                        marginTop: 10,
                    }
                }>
                    <Pressable style={({ pressed }) => [styles.mainButton, pressed && styles.pressed]} onPress={refreshPins}>
                        <Text style={styles.buttonText}>Reload</Text>
                    </Pressable>
                    <Pressable style={({ pressed }) => [styles.mainButton, pressed && styles.pressed]} onPress={() => {
                        if (userLocation && mapRef.current) {
                            mapRef.current.animateCamera({
                                center: userLocation,
                                zoom: 15
                            }, { duration: 750 });
                        } else {
                            Alert.alert("Location not available");
                        }
                    }}>
                        <Text style={styles.buttonText}>Center</Text>
                    </Pressable>
                </View>
            </View>
        )}
        </>
    );
}

const styles = homeStyle