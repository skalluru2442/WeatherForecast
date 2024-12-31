export interface FoursquareVenue {
    id: string;
    name: string;
    distance: number;
    geocodes: Main;
    categories: {
        name: string;
    }[];
}

export interface Main {
    main: MainCoord
}

export interface MainCoord {
    latitude: number;
    longitude: number;
}

export interface FoursquareResponse {
    results: FoursquareVenue[];
}