import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

interface OverpassResponse {
  elements: OverpassElement[];
}

export interface OverpassElement {
  type: string;
  id: number;
  lat: number;
  lon: number;
  tags?: { [key: string]: string };
  center?: { lat: number; lon: number };
}

@Injectable({
  providedIn: 'root'
})
export class NearbyPlacesService {
  private overpassUrl = 'https://overpass-api.de/api/interpreter';

  constructor(private http: HttpClient) { }

  getNearbyTouristPlaces(lat: number, lng: number, radius: number = 1000, limit: number = 5): Observable<OverpassElement[]> {
    const query = `
      [out:json];
      (
        node(around:${radius},${lat},${lng})[tourism];
        node(around:${radius},${lat},${lng})[historic];
        way(around:${radius},${lat},${lng})[tourism];
        way(around:${radius},${lat},${lng})[historic];
        relation(around:${radius},${lat},${lng})[tourism];
        relation(around:${radius},${lat},${lng})[historic];
      );
      out center ${limit};
    `;

    const params = new HttpParams().set('data', query);

    return this.http.get<OverpassResponse>(this.overpassUrl, { params }).pipe(
      map(response => {
        if (response && response.elements) {
            return response.elements.filter(element => (element.lat || element.center?.lat) && (element.lon || element.center?.lon) && element.tags).slice(0, limit);
        } else {
          return [];
        }
      }),
      catchError(error => {
        console.error("Overpass API error:", error);
        return of([]);
      })
    );
  }
}