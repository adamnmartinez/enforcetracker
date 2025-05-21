import React, { useContext, useEffect, useRef, useState } from "react";
import { Animated } from "react-native";
import { TouchableOpacity } from "react-native";
import { View, Text, Button, ScrollView, Alert, Pressable, ActivityIndicator, SafeAreaView } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from "./_contexts/AuthContext";
import { useRouter } from "expo-router";
import { homeStyle } from "./style";
import MapView, { LatLng, LongPressEvent, Marker, MarkerPressEvent, Region, Camera, Circle } from "react-native-maps"
import Slider from '@react-native-community/slider';
import { Pin } from "./pin";
import { Dropdown } from "react-native-element-dropdown"
import * as Location from 'expo-location';
import { HOST } from "./server";

export default function Home() {
    const { userToken, signOut } = useContext(AuthContext);
    const router = useRouter();
    const [markers, setMarkers] = useState<Pin[]>([]);
    const [watchZones, setWatchZones] = useState<{ id: string, coordinates: LatLng, category: string, radius: number }[]>([]);
    // State to track which zone is selected for viewing radius
    const [selectedZone, setSelectedZone] = useState<{ coordinates: LatLng; radius: number } | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showWatchZonesMenu, setShowWatchZonesMenu] = useState(true);
    
    // Animated value for slide-over menu
    const menuWidth = 250;
    const slideAnim = useRef(new Animated.Value(-menuWidth)).current;
    const [menuOpen, setMenuOpen] = useState(false);

    const toggleMenu = () => {
      // Hide any open popups before toggling slide-over menu
      setShowInspector(false);
      setShowWatcherMenu(false);
      setShowCreator(false);
      setShowChoiceMenu(false);
      // setShowWatchZonesMenu(false); // Removed to allow the zones menu to remain open
      Animated.timing(slideAnim, {
        toValue: menuOpen ? -menuWidth : 0,
        duration: 300,
        useNativeDriver: false,
      }).start(() => setMenuOpen(!menuOpen));
    };
    
    // States for choice menu (pin or watch zone)
    const [showChoiceMenu, setShowChoiceMenu] = useState<Boolean>(false);
    const [showWatcherMenu, setShowWatcherMenu] = useState<Boolean>(false);
    const [userData, setUserData] = useState<{username: string, id: string}>({
        username: "",
        id: "",
    })

    // States for creating a new pin
    const [showCreator, setShowCreator] = useState<Boolean>(false);
    const [pinCategory, setPinCategory] = useState<string>("");
    const [pinLocation, setPinLocation] = useState<{ latitude: number, longitude: number}>({
        latitude: 0,
        longitude: 0,
    })

    const [watcherCategory, setWatcherCategory] = useState<string>("")
    const [watcherLocation, setWatcherLocation] = useState<{ latitude: number, longitude: number}>({
        latitude: 0,
        longitude: 0,
    })

    const [watcherRadius, setWatcherRadius] = useState<number>(100);

    // State for pin inspection.
    const [showInspector, setShowInspector] = useState<Boolean>(false);
    const [inspected, setInspected] = useState<{pin: Pin, isWatcher: Boolean}>()
    const [endorsed, setEndorsed] = useState<string[]>([])

    // Map default region. This is changes when a new pin is created, as the map must reload and remain at the last cam location.
    const [mapRegion, setMapRegion] = useState<Region>({
        latitude: 36.974117,
        longitude: -122.030792,
        latitudeDelta: 0.01, 
        longitudeDelta: 0.01,
    })
    // Track the initial region after loading user location
    const [initialRegion, setInitialRegion] = useState<Region | null>(null);

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
        { label: 'Work', value: 'Work' },
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
        try {
            return fetch(HOST + "/api/fetchpins", {
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
                        setMarkers(serverPins)
                    } else {
                        Alert.alert("Pin Fetch Error", "We ran into an error communicating with the server (500)")
                    }
                })
            })
        } catch (e) {
            Alert.alert("Error", "An error occured populating the user map...(500)")
        }
    }

    const fetchWatchers = () => {
        try {
            return fetch(HOST + "/api/fetchwatchers", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    uid: userData.id 
                })
            }).then((response) => {
                response.json().then((data) => {
                    if (response.status == 200) {
                        let serverWatchers: { id: string, coordinates: LatLng, category: string, radius: number }[] = []
                        for (let i = 0; i < data.pins.length; i++) {
                            serverWatchers = [...serverWatchers, {
                                id: data.pins[i].pid,
                                coordinates: {
                                    latitude: data.pins[i].latitude,
                                    longitude: data.pins[i].longitude,
                                },
                                category: data.pins[i].category,
                                radius: data.pins[i].radius
                            }]
                        }
                        setWatchZones(serverWatchers)
                    } else {
                        Alert.alert("Watcher Fetch Error", "We ran into an error communicating with the server (500)")
                    }
                })
            })
        } catch (e) {
            Alert.alert("Error", "An error occured populating the user map...(500)")
        }
    }

    const refreshPins = async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([fetchPins(), fetchWatchers()]);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPins()
        fetchWatchers()
        fetchUserData()
    }, [])

    const fetchUserData = async () => {
        if (!userToken) Alert.alert("NO TOKEN DETECTED")

        try {
            fetch(HOST + "/api/me", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "authorization": userToken ? userToken : "No Token",
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
    const uploadPin = (category: string, coordinates: LatLng, author: string) => {
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
                        Alert.alert("Pin Created!")
                    } else {
                        Alert.alert("Pin Upload Error", "We ran into an error with the server (500)")
                    }
                })
            })
        } catch (e) {
            Alert.alert("Error", e?.toString())
        } finally {
            fetchPins()
        }
    }

    const uploadWatcher = (category: string, coordinates: LatLng, author: string, radius: number) => {
        try {
            fetch(HOST + "/api/pushwatcher", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    category: category,
                    longitude: coordinates.longitude,
                    latitude: coordinates.latitude,
                    author_id: author,
                    radius: radius,
                })
            }).then((response) => {
                response.json().then((data) => {
                    if (response.status == 201) {
                        fetchWatchers()
                    } else {
                        Alert.alert("Watcher Upload Error", "We ran into an error with the server (500)")
                    }
                })
            })
        } catch (e) {
            Alert.alert("Error", e?.toString())
        }   
    }

    const removeWatcher = async (pin_id: string) => {
        try {
            fetch(HOST + "/api/deletewatcher", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    pid: pin_id
                })
            }).then((response) => {
                response.json().then((data) => {
                    if (response.status == 200) {
                        fetchWatchers()
                    } else {
                        Alert.alert("Watcher Delete Error", "We ran into an error with the server (500)")
                    }
                })
            })
        } catch (e) {
            Alert.alert("Error", e?.toString())
        }
    }

    // TEMPORARY ID TRACKER FOR TESTING, PIN ID GENERATION SHOULD BE HANDLED SEPARATELY
    const [IDTracker, setIDTracker] = useState<number>(0)

    // Method for hiding windows and menus
    const hideAllPopups = () => {
      setShowInspector(false);
      setShowWatcherMenu(false);
      setShowCreator(false);
      setShowChoiceMenu(false);
      setShowWatchZonesMenu(false);
     
      // Close slide-over menu if open
      if (menuOpen) {
        Animated.timing(slideAnim, {
          toValue: -menuWidth,
          duration: 300,
          useNativeDriver: false,
        }).start(() => setMenuOpen(false));
      }
    };

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
            const loadedRegion = {
                latitude: coords.latitude - (0.001 * 0.25),
                longitude: coords.longitude,
                latitudeDelta: 0.002,
                longitudeDelta: 0.002,
            };
            setMapRegion(loadedRegion);
            setInitialRegion(loadedRegion);
            setIsLoadingLocation(false);
        })();
    }, []);

    const handleMapLongPress = async (event: LongPressEvent) => {
        // Set new pin location
        const mapPoint = event.nativeEvent.coordinate
        setPinLocation(mapPoint)
        setWatcherLocation(mapPoint)

        // Animate camera movement, offset latitude upward by 25% of latitudeDelta
        mapRef.current?.getCamera().then((cam) => {
            mapRef.current?.animateCamera({
                center: {
                    latitude: mapPoint.latitude - mapRegion.latitudeDelta * 0.25,
                    longitude: mapPoint.longitude,
                },
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

        // Animate map to pin location using animateToRegion for smooth pan+zoom
        const newRegion = {
            latitude: pinLocation.latitude,
            longitude: pinLocation.longitude,
            latitudeDelta: mapRegion.latitudeDelta,
            longitudeDelta: mapRegion.longitudeDelta,
        };
        mapRef.current?.animateToRegion(newRegion, 1500);
        setMapRegion(newRegion);

        try {
            uploadPin(pinCategory, pinLocation, userData.id)
        } catch (e) {
            Alert.alert("An error occured handling a new pin upload.")
        }  finally {
            setEndorsed((prev) => [...prev, newPin.id])
            newPin.validity = newPin.validity + 1
            hideAllPopups()
            refreshPins()
        }
        // Hide windows
        
    }

    const handleNewWatcher = async () => {
        if (watcherCategory == "") {
            Alert.alert("Error", "Please select a category")
            return
        } else if (userData.id == "") {
            Alert.alert("Error", "Could not find user, please reauthenticate and try again.")
            return
        }

        // Animate map to watcher location using animateToRegion for smooth pan+zoom
        const newRegion = {
            latitude: watcherLocation.latitude,
            longitude: watcherLocation.longitude,
            latitudeDelta: mapRegion.latitudeDelta,
            longitudeDelta: mapRegion.longitudeDelta,
        };
        mapRef.current?.animateToRegion(newRegion, 1500);
        setMapRegion(newRegion);

        Alert.alert("Watch Zone Created!", `New watcher at ${watcherLocation.longitude}, ${watcherLocation.latitude} with category ${watcherCategory}`)

        uploadWatcher(watcherCategory, watcherLocation, userData.id, watcherRadius)

        hideAllPopups()
        refreshPins()
    }

    const handleInspectData = (id: string, coordinates: LatLng, category: string, validity: number, isWatcher: Boolean) => {
        setInspected({ 
            pin: {
                id: id,
                coordinates: coordinates,
                category: category,
                validity: validity
            },
            isWatcher: isWatcher
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
            }, { duration: 1500 })
        })

        hideAllPopups()

        setShowInspector(true)
        
    }

    const handleDeleteWatcher = async (pin_id: string | undefined) => {
        if (pin_id == undefined){
            Alert.alert("Could not delete", "Pin ID is undefined.")
            return
        }
        removeWatcher(pin_id)
        hideAllPopups()
        refreshPins()
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
                    setInspected({pin: marker, isWatcher: false})
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
                    setInspected({pin: marker, isWatcher: false})
                }
                
            } else {
                Alert.alert("You cannot unconfirm a report you have not confirmed!")
            }
        }
    }  

    return (
        <>
        {isLoadingLocation ? (
            <SafeAreaView style={[styles.container, { flex: 1 }]}>
                <Text style={styles.title}>Loading location...</Text>
            </SafeAreaView>
        ) : (
            <SafeAreaView style={[styles.container, { flex: 1 }]}>
                <Animated.View
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: slideAnim,
                    width: menuWidth,
                    backgroundColor: "white",
                    elevation: 5,
                    zIndex: 1001,
                    paddingTop: 70,
                    paddingHorizontal: 20,
                  }}
                >
                  <TouchableOpacity
                    style={{ position: 'absolute', top: 60, left: 10, padding: 8 }}
                    onPress={toggleMenu}
                  >
                    <Ionicons name="arrow-back" size={24} color="black" />
                  </TouchableOpacity>
                  <Text style={{ fontSize: 18, marginBottom: 50, top: 30, left:60 }}>Hello, {userData.username}</Text>
                  <Button
                    title="My Watch Zones"
                    onPress={() => {
                      toggleMenu();
                      setShowWatchZonesMenu(true);
                    }}
                  />
                  <Button title="Settings" onPress={() => { /* navigate to settings */ }} />
                    <Button title="Logout" onPress={handleLogout} />    
                </Animated.View>
                <TouchableOpacity
                    style={{
                        position: 'absolute',
                        top: 70,
                        left: 10,
                        padding: 8,
                        zIndex: 1000,
                    }}
                    onPress={toggleMenu}
                >
                    <Ionicons name="menu" size={30} color="black" />
                </TouchableOpacity>
                <Text
                  style={[
                    styles.title,
                    {
                      marginTop: 16,
                      backgroundColor: "rgba(255,255,255,0.9)",
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                    },
                  ]}
                >
                  Welcome, {userData.username}!
                </Text>
                <View style={{ flex: 1}}>
                  <MapView 
                      ref={mapRef}
                      style={styles.map}
                      region={mapRegion}
                      onRegionChangeComplete={(region) => setMapRegion(region)}
                      onLongPress={(event) => {handleMapLongPress(event)}}
                      onMarkerPress={(event) => {handleMarkerClick(event)}}
                      onPress={() => hideAllPopups()}
                      showsUserLocation={true}
                  >
                  {(showChoiceMenu || showCreator || showWatcherMenu) && (
                      <Marker
                          key="preview-pin"
                          coordinate={pinLocation}
                          pinColor="gray"
                      />
                  )}

                  {showWatcherMenu && (
                      <Circle
                          key="preview-circle"
                          center={pinLocation}
                          radius={watcherRadius}
                          strokeColor="rgba(0, 0, 255, 0.5)"
                          fillColor="rgba(0, 0, 255, 0.2)"
                      />
                  )}

                  {markers.map((data, index) => (
                      <Marker 
                          key={index} 
                          pinColor={getPinColor(data.category)}
                          onPress={() => {handleInspectData(data.id, data.coordinates, data.category, data.validity, false)}} 
                          coordinate={{latitude: data.coordinates.latitude, longitude: data.coordinates.longitude}}
                      />
                  ))}
                  {watchZones.map((data, index) => (
                      <Marker 
                          key={data.id}
                          // pinColor={getPinColor(data.category)}
                          onPress={() => {
                            // Clear others
                            hideAllPopups();
                            // Show radius and center map
                            setSelectedZone({ coordinates: data.coordinates, radius: data.radius });
                            const lat = data.coordinates.latitude;
                            const lon = data.coordinates.longitude;
                            const r = data.radius;
                            const latDelta = (r * 2) / 110000;
                              const lonDelta = latDelta / Math.cos(lat * Math.PI / 100);
                            mapRef.current?.animateToRegion(
                              { latitude: lat, longitude: lon, latitudeDelta: latDelta, longitudeDelta: lonDelta },
                              750
                            );
                          }} 
                          coordinate={{latitude: data.coordinates.latitude, longitude: data.coordinates.longitude}}
                      />
                  ))}
                  {selectedZone && (
                    <Circle
                      center={selectedZone.coordinates}
                      radius={selectedZone.radius}
                      strokeColor="rgba(0, 0, 255, 0.7)"
                      fillColor="rgba(0, 0, 255, 0.3)"
                    />
                  )}
                  </MapView>
                  <Pressable
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      backgroundColor: 'white',
                      padding: 8,
                      borderRadius: 20,
                      elevation: 4,
                      zIndex: 1000,
                    }}
                    onPress={() => {
                      if (initialRegion) {
                        mapRef.current?.animateToRegion(initialRegion, 1000);
                        setMapRegion(initialRegion);
                      } else {
                        Alert.alert("Still loading initial view");
                      }
                    }}
                  >
                    <Ionicons name="locate" size={24} color="black" />
                  </Pressable>
                  <Pressable
                    style={{
                      position: 'absolute',
                      top: 60,
                      right: 10,
                      backgroundColor: 'white',
                      padding: 8,
                      borderRadius: 20,
                      elevation: 4,
                      zIndex: 1000,
                    }}
                    onPress={refreshPins}
                  >
                    {isRefreshing ? (
                      <ActivityIndicator size="small" />
                    ) : (
                      <Ionicons name="reload" size={24} color="black" />
                    )}
                  </Pressable>
                  {showWatchZonesMenu && (
                    <View
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        maxHeight: 200,
                        backgroundColor: 'white',
                        paddingVertical: 12,
                        borderTopLeftRadius: 12,
                        borderTopRightRadius: 12,
                        zIndex: 1000,
                      }}
                    >
                      <Text style={styles.popupHeader}>My Watch Zones</Text>
                      <ScrollView contentContainerStyle={{ paddingHorizontal: 16 }}>
                        {watchZones.map((zone) => (
                          <TouchableOpacity
                            key={zone.id}
                            style={styles.popupItem}
                            onPress={() => {
                              setSelectedZone(zone);
                              const lat = zone.coordinates.latitude;
                              const lon = zone.coordinates.longitude;
                              const r = zone.radius;
                              // Calculate deltas to fit circle
                              const latDelta = (r * 2) / 110000;
                              const lonDelta = latDelta / Math.cos(lat * Math.PI / 100);
                              mapRef.current?.animateToRegion(
                                { latitude: lat, longitude: lon, latitudeDelta: latDelta, longitudeDelta: lonDelta },
                                750
                              );
                            }}
                          >
                            <Text style={styles.popupText}>{zone.category}</Text>
                            <Text style={styles.popupTextSmall}>
                              {zone.coordinates.latitude.toFixed(4)}, {zone.coordinates.longitude.toFixed(4)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      <Button title="Close" onPress={() => setShowWatchZonesMenu(false)} />
                    </View>
                  )}
                </View>
                {showInspector && 
                    <View style={styles.popup}>
                        <Text style={styles.popupHeader}>{ inspected?.isWatcher ? "Watch Zone" : "Report"}</Text>
                        <Text style={styles.popupText}>ID: {inspected?.pin.id}</Text>
                        <Text style={styles.popupText}>Category: {inspected?.pin.category}</Text>
                        { inspected?.isWatcher ? 
                            <Button title={`Delete Zone`} onPress={() => {handleDeleteWatcher(inspected?.pin.id)}}></Button> :
                            <Button title={`Confirmations ${inspected?.pin.validity}`} onPress={() => {handleValidate(inspected?.pin.id || "")}}></Button>
                        }
                        { inspected && endorsed.includes(inspected.pin.id) &&
                            <Button title={`Unconfirm Report`} onPress={() => {handleUnvalidate(inspected.pin.id)}}></Button>
                        }
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
                                setShowWatcherMenu(true)
                                }}/>
                            <Button title="Close" onPress={() => {hideAllPopups()}}/>
                        </View>
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
                        <ScrollView style={{flex: 1}}>
                            <View style={{height: 650}}>
                                <Text style={styles.popupText}>{watcherLocation.latitude}, </Text>
                                <Text style={styles.popupText}>{watcherLocation.longitude}, </Text>
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
                                    value={watcherCategory}
                                    search={false}
                                    onChange={item => {
                                    setWatcherCategory(item.value);
                                    }}
                                    dropdownPosition="top"
                                />
                                <View style={{ alignItems: 'center', marginVertical: 10 }}>
                                    <Text style={styles.popupText}>Radius: {watcherRadius} meters</Text>
                                    <Slider
                                        style={{ width: 250, height: 40 }}
                                        minimumValue={5}
                                        maximumValue={200}
                                        step={5}
                                        value={watcherRadius}
                                        onValueChange={(value: number) => setWatcherRadius(value)}
                                    />
                                </View>
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
                        </ScrollView>
                        
                    </View>
                }
            </SafeAreaView>
        )}
        </>
    );
}

const styles = {
  ...homeStyle,
  popupItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  popupTextSmall: {
    fontSize: 12,
    color: '#555',
  },
}