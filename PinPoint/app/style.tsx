import { StyleSheet, Dimensions } from "react-native";

const authStyle = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        padding: 20
    },
    title: {
        fontSize: 24,
        padding: 20,
        textAlign: "center"
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
    },
    header: {
        fontSize: 38,
        textAlign: "center",
        padding: 20,
        paddingBottom: 80,
    }
});

const homeStyle = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
    },
    map: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
        zIndex: 0,
    },
    popup: {
        flex: 1,
        position: "absolute",
        borderRadius: 10,
        top: Dimensions.get('window').height * 0.65,
        left: 0,
        zIndex: 9999,
        elevation: 10,
        width : Dimensions.get('window').width,
        height: Dimensions.get('window').height,
        color: "white",
        backgroundColor: "white",
        paddingTop: 10,
        padding: 20,
    },
    popupHeader: {
        textAlign: "center",
        textAlignVertical: "center",
        fontWeight: "bold",
        fontSize: 20,
    },
    popupText: {
        textAlign: "center",
        textAlignVertical: "center",
        fontSize: 14,
    },
    popupButton: {
        backgroundColor: "blue",
        color: "red",
    },
    dropdown: {
        padding: 20,   
    },
    mainButton: {
        display: "flex",
        padding: 10,
        paddingLeft: 40,
        paddingRight: 40,
        width: 150,
        height: 35,
        borderRadius: 25,
        textAlign: "center",
        backgroundColor: "cornflowerblue",
    },
    pressed: {
        opacity: 0.7,
    },
    menuButton: {
        display: "flex",
        padding: 10,
        paddingLeft: 35,
        paddingRight: 35,
        width: 150,
        height: 35,
        borderRadius: 25,
        backgroundColor: "cornflowerblue",
    },
    buttonText: {
        textAlign: "center",
        color: "white"
    }
});

const placeholderColor = "#ccc"

export { authStyle, homeStyle, placeholderColor }