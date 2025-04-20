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
        height: Dimensions.get('window').height / 1.3,
        zIndex: 1,
    },
    popup: {
        flex: 1,
        position: "absolute",
        borderRadius: 10,
        top: Dimensions.get('window').height / 1.5,
        left: 0,
        zIndex: 9999,
        elevation: 10,
        width : Dimensions.get('window').width,
        height: Dimensions.get('window').height / 2,
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
    }
});

const placeholderColor = "#ccc"

export { authStyle, homeStyle, placeholderColor }