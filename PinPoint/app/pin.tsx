import { LatLng } from "react-native-maps";

export class Pin {
    coordinates: LatLng
    category: string;
    id: string;
    author: string;
    validity: number;

    constructor(coord: LatLng, category: string, id: string, author: string) {
        this.coordinates = {
            latitude: coord.latitude,
            longitude: coord.longitude,
        }
        this.category = category;
        this.id = id;
        this.validity = 0;
        this.author = author
    }
}

export class Watcher {
    coordinates: LatLng
    category: string;
    id: string;
    author: string;
    radius: number;

    constructor(coord: LatLng, category: string, id: string, author: string, radius: number) {
        this.coordinates = {
            latitude: coord.latitude,
            longitude: coord.longitude,
        }
        this.category = category;
        this.id = id;
        this.author = author
        this.radius = radius
    }
}