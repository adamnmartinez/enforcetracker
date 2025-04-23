import { LatLng } from "react-native-maps";

export class Pin {
    coordinates: LatLng
    category: string;
    id: string;
    validity: number;

    constructor(coord: LatLng, category: string, id: string) {
        this.coordinates = {
            latitude: coord.latitude,
            longitude: coord.longitude,
        }
        this.category = category;
        this.id = id;
        this.validity = 0;
    }
}