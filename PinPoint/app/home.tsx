import React, { useContext, useEffect, useRef, useState } from "react";
import { Animated, TouchableOpacity, Platform, View, Text, Button, ScrollView, Alert, Pressable, ActivityIndicator, SafeAreaView } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from "./_contexts/AuthContext";
import { useRouter } from "expo-router";
import { homeStyle } from "./style";
import MapView, {
  LatLng,
  LongPressEvent,
  Marker,
  MarkerPressEvent,
  Region,
  Camera,
  Circle,
} from "react-native-maps";
import Slider from "@react-native-community/slider";
import { Pin, Watcher } from "./pin";
import { Dropdown } from "react-native-element-dropdown";
import * as Location from "expo-location";
import { HOST } from "./server";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { endorsePinCall, removeEndorseCall } from "./validity"

function handleRegistrationError(errorMessage: string) {
  Alert.alert("Notification Error", errorMessage);
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotificationsAsync() {
  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      handleRegistrationError(
        "Permission not granted to get push token for push notification!",
      );
      return;
    }
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;
    if (!projectId) {
      handleRegistrationError("Project ID not found");
    }
    try {
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      return pushTokenString;
    } catch (e: unknown) {
      handleRegistrationError(`${e}`);
    }
  } else {
    handleRegistrationError("Must use physical device for push notifications");
  }
}

export default function Home() {

  const router = useRouter();

  // TEMPORARY ID TRACKER FOR TESTING, PIN ID GENERATION SHOULD BE HANDLED SEPARATELY
  const [IDTracker, setIDTracker] = useState<number>(0);
  // User Auth Token
  const { userToken, signOut } = useContext(AuthContext);
  const [markers, setMarkers] = useState<Pin[]>([]);
  const [watchZones, setWatchZones] = useState<Watcher[]>([]);
  // Menu States
  const [showChoiceMenu, setShowChoiceMenu] = useState<Boolean>(false);
  const [showWatcherMenu, setShowWatcherMenu] = useState<Boolean>(false);
  // User's data, used by several methods.
  const [userData, setUserData] = useState<{
    username: string;
    id: string;
    expotoken: string;
  }>({
    username: "",
    id: "",
    expotoken: "",
  });
  // States for pins
  const [showCreator, setShowCreator] = useState<Boolean>(false);
  const [pinCategory, setPinCategory] = useState<string>("");
  const [pinLocation, setPinLocation] = useState<{
    latitude: number;
    longitude: number;
  }>({
    latitude: 0,
    longitude: 0,
  });
  // States for watchers
  const [watcherCategory, setWatcherCategory] = useState<string>("");
  const [watcherLocation, setWatcherLocation] = useState<{
    latitude: number;
    longitude: number;
  }>({
    latitude: 0,
    longitude: 0,
  });
  const [watcherRadius, setWatcherRadius] = useState<number>(100);
  // State for pin inspection.
  const [showInspector, setShowInspector] = useState<Boolean>(false);
  const [inspected, setInspected] = useState<Pin | Watcher>();
  const [endorsed, setEndorsed] = useState<string[]>([]);
  // Map Region State
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 36.974117,
    longitude: -122.030792,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  // Use Region (map view coordinates)
  const [initialRegion, setInitialRegion] = useState<Region | null>(null);
  // Map Reference
  const mapRef = useRef<MapView>(null);
  // Track user location
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  // Creator menu dropdown options, "Categories"
  const public_category = [
    { label: "Police", value: "Police" },
    { label: "Immigration Enforcment", value: "Immigration Enforcement" },
    { label: "Parking Enforcement", value: "Parking Enforcment" },
    { label: "Campus Security (CSO)", value: "CSO" },
  ];
  const private_category = [
    { label: "Home", value: "Home" },
    { label: "Work", value: "Work" },
    { label: "Car", value: "Car" },
    { label: "General", value: "General" },
  ];
  // Notification States
  const [expoPushToken, setExpoPushToken] = useState("");
  const [channels, setChannels] = useState<Notifications.NotificationChannel[]>(
    [],
  );
  const [notification, setNotification] = useState<
    Notifications.Notification | undefined
  >(undefined);
  // Notification References
  const notificationListener = useRef<Notifications.EventSubscription>(null);
  const responseListener = useRef<Notifications.EventSubscription>(null);

  // State to track which zone is selected for viewing radius
    const [selectedZone, setSelectedZone] = useState<{ coordinates: LatLng; radius: number } | null>(null);
    // Track if a marker was just pressed to prevent map tap from clearing selection
    const [markerPressed, setMarkerPressed] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showWatchZonesMenu, setShowWatchZonesMenu] = useState(false);
    
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
      
  // Convert category string to CSS Color for display
  const getPinColor = (category: string) => {
    switch (category) {
      case "Police":
        return "blue";

      case "Immigration Enforcement":
        return "red";

      case "Parking Enforcment":
        return "yellow";

      case "CSO":
        return "brown";

      default:
        return "";
    }
  };

  const fetchPinValidity = async (pin_id: string) => {
    let score = 0
    try {
      const response = await fetch(HOST + "/api/validates/getscore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pin: pin_id,
        })
      })
      
      const data = await response.json()

      if (response.status == 200) {
        score = data.score
        console.log(`${pin_id} score of ${score}`)
      }
    } catch (e) {
      console.log("An error occured determining if the pin was validated or not...")
      console.error(e)
    } finally {
      markers.filter((pin) => pin.id == pin_id)[0].validity = score
      refreshPins()
    }
  }

  const fetchValidatedCall = async (user_id: string) => {
    console.log(`Getting validation data for ${user_id}`)
    let validated: string[] = []
    try {
      const response = await fetch(HOST + "/api/validates/getvalidated", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user: user_id,
        })
      })
      
      const data = await response.json()

      if (response.status == 200) {
        validated = data.validated
      }
    } catch (e) {
      console.log("An error occured determining if the pin was validated or not...")
      console.error(e)
    } finally {
      setEndorsed(validated)
    }
  }

  const fetchPinsCall = async () => {
    let serverPins: Pin[] = []
    try {
      const response = await fetch(HOST + "/api/fetchpins", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.status == 200) {
          for (let i = 0; i < data.pins.length; i++) {
            serverPins = [
              ...serverPins,
              new Pin(
                {
                  latitude: data.pins[i].latitude,
                  longitude: data.pins[i].longitude,
                },
                data.pins[i].category,
                data.pins[i].pid,
                data.pins[i].uid,
              ),
            ];
          }
      } else {
        Alert.alert(
          "Pin Fetch Error",
          "We ran into an error communicating with the server (500)",
        );
      }
    } catch (e) {
      Alert.alert("Error", "An error occured populating the user map...(500)");
    } finally {
      setMarkers(serverPins)
    }
  };

  const fetchWatchersCall = async () => {
    try {
      const response = await fetch(HOST + "/api/fetchwatchers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: userData.id,
        }),
      })

      const data = await response.json()

      if (response.status == 200) {
        let serverWatchers: Watcher[] = [];
        for (let i = 0; i < data.pins.length; i++) {
          serverWatchers = [
            ...serverWatchers,
            new Watcher(
              {
                latitude: data.pins[i].latitude,
                longitude: data.pins[i].longitude,
              },
              data.pins[i].category,
              data.pins[i].pid,
              data.pins[i].uid,
              data.pins[i].radius,
            ),
          ];
        }
        await setWatchZones(serverWatchers);
      } else {
        Alert.alert(
          "Watcher Fetch Error",
          "We ran into an error communicating with the server (500)",
        );
      }

    } catch (e) {
      Alert.alert("Error", "An error occured populating the user map...(500)");
    }
  };

  const refreshPins = async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([fetchPinsCall(), fetchWatchersCall()]);
        } finally {
            setIsRefreshing(false);
        }
    };

  const fetchUserDataCall = async () => {
    if (!userToken) Alert.alert("NO TOKEN DETECTED");
    try {
      const response = await fetch(HOST + "/api/me", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          authorization: userToken ? userToken : "No Token",
        },
      })

      const data = await response.json()

      if (response.status == 200) {
        setUserData({
          username: data.username,
          id: data.id,
          expotoken: data.expotoken,
        });
      } else {
        Alert.alert("Error", data.message || "Failed to get user data (500)");
      }

    } catch (e) {
      Alert.alert("Error", "An error occured getting user data... (500)")
    }
  };

  useEffect(() => {
    if (userData.id) {
      fetchValidatedCall(userData.id)
    }
  }, [userData.id])

  const uploadPinCall = async (
    category: string,
    coordinates: LatLng,
    author: string,
  ) => {
    try {
      const response = await fetch(HOST + "/api/pushpin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: category,
          longitude: coordinates.longitude,
          latitude: coordinates.latitude,
          author_id: author,
        }),
      })
      const data = await response.json()
      
      if (response.status == 201) {
        Alert.alert("Pin Created!")
      } else if (response.status == 429) {
        Alert.alert("Slow Down!", "You have sent too many requests, please try again later.");
      } else {
        Alert.alert("Pin Upload Failed", data.message || "Failed to upload pin");
      }
      
    } catch (e) {
      Alert.alert("Error", e?.toString());
    } finally {
      fetchPinsCall();
    }
  };


  const uploadWatcherCall = async (
    category: string,
    coordinates: LatLng,
    author: string,
    radius: number,
  ) => {
    try {
      const response = await fetch(HOST + "/api/pushwatcher", {
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
        }),
      })

      const data = await response.json()


      if (response.status == 201) {
        Alert.alert("Watch Zone Created!", `New watcher at ${watcherLocation.longitude}, ${watcherLocation.latitude} with category ${watcherCategory}`,);
        fetchWatchersCall();
      } else if (response.status == 429) {
        Alert.alert("Slow Down!", "You have sent too many requests, please try again later.");
      } else if (response.status == 403) {
        Alert.alert("Watch Zone Creation Error", "Users are limited to two watch zones per account.");
      } else {
        Alert.alert("Watch Zone Creation Error", data.message || "Failed to create watcher");
      }

    } catch (e) {
      Alert.alert("Error", e?.toString());
    } finally {
      fetchWatchersCall()
    }
  };

  const deleteWatcherCall = async (pin_id: string) => {
    try {
      const response = await fetch(HOST + "/api/deletewatcher", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pid: pin_id,
        }),
      })

      const data = await response.json()

      if (response.status == 200) {
        console.log("Delete Watcher Success")
      } else {
        Alert.alert("Error", data.message || "Failed to delete watcher");
      }

    } catch (e) {
      Alert.alert("Error", e?.toString());
    } finally {
      fetchWatchersCall();
    }
  };

  const deletePinCall = async (pid: string, uid: string) => {
    try {
      const response = await fetch(HOST + "/api/deletepin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pid, uid }),
      })

      const data = await response.json()

      if (response.status === 200) {
        console.log("Delete Pin Success")
      } else {
        Alert.alert("Error", data.message || "Failed to delete pin");
      }
    } catch (e) {
      Alert.alert("Pin Delete Error", e?.toString());
    } finally {
      fetchPinsCall()
    }
  };

              
   // Method for hiding windows and menus
    const hideAllPopups = () => {
      setShowInspector(false);
      setShowWatcherMenu(false);
      setShowCreator(false);
      setShowChoiceMenu(false);
      setShowWatchZonesMenu(false);
      //setSelectedZone(null);
      // Close slide-over menu if open
      if (menuOpen) {
        Animated.timing(slideAnim, {
          toValue: -menuWidth,
          duration: 300,
          useNativeDriver: false,
        }).start(() => setMenuOpen(false));
      }
    };   

  // Frontend handler functions
  const handleLogout = async () => {
    await signOut();
    router.replace("/login");
  };
  
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
    hideAllPopups();
    setShowChoiceMenu(true);
  };

  const handleCreatePin = async () => {
    // Create new pin object and assign ID
    if (pinCategory == "") {
      Alert.alert("Error", "Please select a category");
      return;
    }


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
      uploadPinCall(pinCategory, pinLocation, userData.id);
    } catch (e) {
      Alert.alert("An error occured handling a new pin upload.");
    } finally {
      hideAllPopups();
      refreshPins();

    }
  };

  const handleCreateWatcher = async () => {
    if (watcherCategory == "") {
      Alert.alert("Error", "Please select a category");
      return;
    } else if (userData.id == "") {
      Alert.alert(
        "Error",
        "Could not find user, please reauthenticate and try again.",
      );
      return;
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

    uploadWatcherCall(
      watcherCategory,
      watcherLocation,
      userData.id,
      watcherRadius,
    );

    hideAllPopups();
    refreshPins();
  };

  const handleInspectData = async (inspectTarget: Pin | Watcher) => {
    if (inspectTarget instanceof Pin) {
      try {
        await fetchPinValidity(inspectTarget.id)
        // await setMapRegion({
        //   latitude: inspectTarget.coordinates.latitude - 0.0003,
        //   longitude: inspectTarget.coordinates.longitude,
        //   latitudeDelta: 0.002,
        //   longitudeDelta: 0.002,
        // })
        await setInspected(inspectTarget)
      } catch (e) {
        console.log("An error occured inspecting a pin...")
      } finally {
        setShowInspector(true)
      }
    } else {
      setInspected(inspectTarget);
    }
  };

      const handleMarkerClick = async (event: MarkerPressEvent, radius?: number) => {
        if ( radius ){setMarkerPressed(true)};
        const markerPoint = event.nativeEvent.coordinate;
        // Hide any open popups
        hideAllPopups();
        if (radius) {
          setSelectedZone({ coordinates: event.nativeEvent.coordinate, radius });
          const lat = event.nativeEvent.coordinate.latitude;
          const lon = event.nativeEvent.coordinate.longitude;
          const latDelta = (radius * 2) / 111000;
          const lonDelta = latDelta / Math.cos(lat * Math.PI / 180);
          // Center above the marker, offset by 25% of latitudeDelta
          const latOffset = mapRegion.latitudeDelta * 0.25;
          mapRef.current?.animateToRegion(
            {
              latitude: lat + latOffset,
              longitude: lon,
              latitudeDelta: latDelta,
              longitudeDelta: lonDelta
            },
            1500
          );
        } else {
          // Compute vertical offset: push marker up by 25% of current latitudeDelta
          const latOffset = mapRegion.latitudeDelta * 0.25;
          // Animate map to region centered above the marker
          mapRef.current?.animateToRegion(
            {
              latitude: markerPoint.latitude - latOffset,
              longitude: markerPoint.longitude,
              latitudeDelta: mapRegion.latitudeDelta,
              longitudeDelta: mapRegion.longitudeDelta,
            },
            1500
          );
        }
        // Show inspector popup
        setShowInspector(true);
    };


  const handleDeleteWatcher = async (pin_id: string | undefined) => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this watch zone?",
      [
        {
          text: "Yes",
          onPress: () => {
            if (pin_id == undefined) {
              Alert.alert("Could not delete", "Watcher ID is undefined.");
              return;
            }
            deleteWatcherCall(pin_id);
            hideAllPopups();
            setSelectedZone(null);
            refreshPins();
          },
        },
        {
          text: "No",
          onPress: () => {
            return;
          },
        },
      ],
    );
  };

  const handleDeletePin = async (pin_id: string | undefined) => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this report?",
      [
        {
          text: "Yes",
          onPress: () => {
            if (pin_id == undefined) {
              Alert.alert("Could not delete", "Pin ID is undefined.");
              return;
            }
            // TODO: Disallow pin deletions after confirmation threshold.
            deletePinCall(pin_id, userData.id);
            hideAllPopups();
            refreshPins();
          },
        },
        {
          text: "No",
          onPress: () => {
            return;
          },
        },
      ],
    );
  };

  const handleValidate = async (pin_id: string) => {
    if (pin_id !== "") {
      if (!endorsed.includes(pin_id)) {
        try {
          setShowInspector(false)
          setEndorsed((prev) => [...prev, pin_id]);

          const marker = markers.find((obj) => {
            return obj.id == pin_id;
          });

          if (marker) {
            await endorsePinCall(userData.id, pin_id);
            setInspected(marker);
          }
        } catch (e) {
          console.log(e)
        } finally {
          setShowInspector(true)
        }        
      } else {
        Alert.alert("You have already confirmed this report!");
      }
    }
  };

  const handleUnvalidate = async (pin_id: string) => {
    if (pin_id !== "") {
      if (endorsed.includes(pin_id)) {
        try {
          setShowInspector(false)
          setEndorsed((prev) => prev.filter((item) => item != pin_id));

          const marker = markers.find((obj) => {
            return obj.id == pin_id;
          });

          if (marker) {
            marker.validity = marker.validity - 1;
            await removeEndorseCall(userData.id, pin_id);
            setInspected(marker);
          }

          fetchPinValidity(pin_id)

        } catch (e) {
          console.log(e)
        } finally {
          setShowInspector(true)
        }
        
      } else {
        Alert.alert("You cannot unconfirm a report you have not confirmed!");
      }
    }
  };
  
  // When the user's endorsements change, or when the user inspects a new pin, we want to get an accurate count of the pin's endorsments.
  useEffect(() => {
    if (inspected) fetchPinValidity(inspected.id)
  }, [endorsed, inspected])

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


  useEffect(() => {
    fetchPinsCall()
    fetchWatchersCall();
    fetchUserDataCall();
  }, []);

  useEffect(() => {
    registerForPushNotificationsAsync().then(
      (token) => token && setExpoPushToken(token),
    );

    if (Platform.OS === "android") {
      Notifications.getNotificationChannelsAsync().then((value) =>
        setChannels(value ?? []),
      );
    }
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        // console.log(response);
      });

    return () => {
      notificationListener.current &&
        Notifications.removeNotificationSubscription(
          notificationListener.current,
        );
      responseListener.current &&
        Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);
  
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
                      onMarkerPress={(event) => {
                        handleMarkerClick(event);
                    }}
                      onPress={() => {
                        // If a marker was just pressed, skip clearing
                        if (markerPressed) {
                          setMarkerPressed(false);
                          return;
                        }
                        // Clear the radius circle when watcher inspector or watch-zones list is open
                        if ((showInspector && inspected?.isWatcher) || showWatchZonesMenu) {
                          setSelectedZone(null);
                        }
                        hideAllPopups();
                      }}
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
                          onPress={() => { handleInspectData(data); }} 
                          coordinate={{latitude: data.coordinates.latitude, longitude: data.coordinates.longitude}}
                      />
                  ))}
                  {watchZones.map((data, index) => (
                      <Marker 
                          key={index}
                          // pinColor={getPinColor(data.category)}
                          onPress={() => {
                            handleInspectData(data);
                            setSelectedZone({
                              coordinates: data.coordinates,
                              radius: data.radius
                            });
                            const lat = data.coordinates.latitude;
                            const lon = data.coordinates.longitude;
                            const r = data.radius;
                            // Calculate deltas to fit circle
                            const latDelta = (r * 2) / 110000;
                            const lonDelta = latDelta / Math.cos(lat * Math.PI / 100);
        
                            // Center within the visible map (not behind bottom menu)
                            const bottomFraction = 0.5; // bottom sheet covers 50% of height
                            const latOffset = latDelta * (bottomFraction * 2.5);
                            mapRef.current?.animateToRegion(
                              {
                                latitude: lat - latOffset,
                                longitude: lon,
                                latitudeDelta: latDelta,
                                longitudeDelta: lonDelta
                              },
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
                      zIndex={1000}
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
                </View>
                {showWatchZonesMenu && (
                  <View
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '50%',
                      backgroundColor: 'white',
                      paddingVertical: 12,
                      borderTopLeftRadius: 12,
                      borderTopRightRadius: 12,
                      zIndex: 1000,
                    }}
                  >
                    <Text style={styles.popupHeader}>My Watch Zones</Text>
                    <ScrollView style={{ flex: 1, paddingHorizontal: 16 }}>
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
        
                        // Center within the visible map (not behind bottom menu)
                        const bottomFraction = 0.5; // bottom sheet covers 50% of height
                        const latOffset = latDelta * (bottomFraction * 2.5);
                        mapRef.current?.animateToRegion(
                            {
                            latitude: lat - latOffset,
                            longitude: lon,
                            latitudeDelta: latDelta,
                            longitudeDelta: lonDelta
                            },
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
                    <Button title="Close" onPress={() => {
                            hideAllPopups();
                            setSelectedZone(null)
                            }}/>
                  </View>
                )}
                {showInspector && 
                    <View style={styles.popup}>
                        <Text style={styles.popupHeader}>{ inspected?.isWatcher ? "Watch Zone" : "Report"}</Text>
                        <Text style={styles.popupText}>ID: {inspected?.id}</Text>
                        <Text style={styles.popupText}>Category: {inspected?.category}</Text>
                        { inspected?.isWatcher ? 
                            <Button title={`Delete Zone`} onPress={() => {handleDeleteWatcher(inspected?.id)}}></Button> :
                            <Button title={`Confirmations ${inspected?.validity}`} onPress={() => {handleValidate(inspected?.id || "")}}></Button>
                        }
                        { inspected && endorsed.includes(inspected.id) &&
                            <Button title={`Unconfirm Report`} onPress={() => {handleUnvalidate(inspected.id)}}></Button>
                        }
                        <Button title="Close" onPress={() => {
                            hideAllPopups();
                            setSelectedZone(null)
                            }}/>
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
                            <Button title="Close" onPress={() => {
                            hideAllPopups();
                            setSelectedZone(null)
                            }}/>
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
                            <Pressable style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]} onPress={handleCreatePin}>
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
                                        onValueChange={(value: number) => {
                                            setWatcherRadius(value);
                                        }}
                                        onSlidingComplete={(value: number) => {
                                            // Animate map to fit the completed radius
                                            const lat = watcherLocation.latitude;
                                            const lon = watcherLocation.longitude;
                                            const latDelta = (value * 2) / 111000;
                                            const lonDelta = latDelta / Math.cos(lat * Math.PI / 180);
                                            const latOffset = latDelta * 0.25; // offset to account for bottom sheet
                                            const region = {
                                              latitude: lat - latOffset * 2,
                                              longitude: lon,
                                              latitudeDelta: latDelta,
                                              longitudeDelta: lonDelta,
                                            };
                                            mapRef.current?.animateToRegion(region, 300);
                                            setMapRegion(region);
                                        }}
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
                                    <Pressable style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]} onPress={handleCreateWatcher}>
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