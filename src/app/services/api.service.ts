import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CurrentWeather, fiveDayWeather } from '../models/currentWether';
import { FoursquareResponse, FoursquareVenue } from '../models/nearByPlaces';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly openWeatherMapApiKey = 'ffcd68248b2424bc483eb95a660b6823';
  private readonly weatherBaseUrl = 'https://api.openweathermap.org/data/2.5';
  private readonly foursquareUrl = 'https://api.foursquare.com/v3/places/';
  private readonly foursquareApiKey = 'fsq3GzvpwR6Ilbh/fkXjYJj2MVFI1noxFb26fzU9AnQFaso=';

  constructor(private http: HttpClient) {}

  private constructUrl(endpoint: string, params: Record<string, any>): string {
    const httpParams = new HttpParams({
      fromObject: { ...params, appid: this.openWeatherMapApiKey },
    });
    return `${this.weatherBaseUrl}/${endpoint}?${httpParams.toString()}`;
  }

  getCurrentWeather(lat: number, lon: number): Observable<CurrentWeather> {
    const url = this.constructUrl('weather', { lat, lon });
    return this.http.get<CurrentWeather>(url);
  }

  getCurrentWeatherByCity(city: string): Observable<CurrentWeather> {
    const url = this.constructUrl('weather', { q: city });
    return this.http.get<CurrentWeather>(url);
  }

  getHourlyForecast(lat: number, lon: number, cnt?: number): Observable<fiveDayWeather> {
    const params: Record<string, any> = { lat, lon };
    if (cnt) params['cnt'] = cnt;
    const url = this.constructUrl('forecast', params);
    return this.http.get<fiveDayWeather>(url);
  }

  getHourlyForecastByCity(city: string, cnt?: number): Observable<fiveDayWeather> {
    const params: Record<string, any> = { q: city };
    if (cnt) params['cnt'] = cnt;
    const url = this.constructUrl('forecast', params);
    return this.http.get<fiveDayWeather>(url);
  }

  getNearByPlacesList(latitude: number, longitude: number): Observable<FoursquareResponse> {
    const headers = new HttpHeaders({
      Authorization: `${this.foursquareApiKey}`,
    });
    const url = `${this.foursquareUrl}nearby?ll=${latitude},${longitude}&radius=1000&limit=10`;
    return this.http.get<FoursquareResponse>(url, { headers });
  }
}
