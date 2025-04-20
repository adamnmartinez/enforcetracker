import { LatLng } from "react-native-maps";

export class Pin {
    coordinates: LatLng
    category: string;
    id: string;

    constructor(coord: LatLng, category: string, id: string) {
        this.coordinates = {
            latitude: coord.latitude,
            longitude: coord.longitude,
        }
        this.category = category;
        this.id = id;
    }
}