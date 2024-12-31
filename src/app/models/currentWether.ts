
// for current weather response
export interface CurrentWeather {
    weather: Weather[],
    coord: Coord,
    main: Main,
    base: string,
    visibility: number,
    wind: Wind,
    clouds: Clouds,
    dt: number,
    sys: Sys,
    timezone: number,
    id: number,
    name: string,
    code: number
}

export interface Weather {
    id: number,
    main: string,
    description: string,
    icon: string
}
export interface Coord {
    lon: number,
    lat: number
}

export interface Main {
    temp: number,
    feels_like: number,
    temp_min: number,
    temp_max: number,
    pressure: number,
    humidity: number,
    sea_level: number,
    grnd_level: number
}

export interface Wind {
    speed: number,
    deg: number
}

export interface Clouds {
    all: string
}

export interface Sys {
    type: number,
    id: number,
    country: string,
    sunrise: number,
    sunset: number
}


// for five day response
export interface fiveDayWeather {
    cod: string,
    message: number,
    cnt: number,
    list: dayWeather[],
    city: cityData,
}

export interface dayWeather {
    dt: number,
    weather: Weather[],
    clouds: Clouds,
    wind: WindData,
    visibility: number,
    pop: number,
    dt_txt: string,
    sys: SysData,
    main: MainData
}

export interface WindData {
    speed: number,
    deg: number,
    gust: number
}

export interface MainData {
    temp: number,
    feels_like: number,
    temp_min: number,
    temp_max: number,
    pressure: number,
    sea_level: number,
    grnd_level: number,
    humidity: number,
    temp_kf: number,
}

export interface SysData {
    pod: string
}

export interface cityData {
    id: number,
    name: string,
    coord: Coord,
    country: string,
    population: number,
    timezone: number,
    sunrise: number,
    sunset: number
}