export class Pin {
    coordinates: {
        latitude: number,
        longitude: number
    }
    category: string;
    id: string;

    constructor(lat: number, long: number, category: string, id: string) {
        this.coordinates = {
            latitude: lat,
            longitude: long,
        }
        this.category = category;
        this.id = id;
    }
}