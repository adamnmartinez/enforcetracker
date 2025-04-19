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
    }
});

const placeholderColor = "#ccc"

export { authStyle, homeStyle, placeholderColor }