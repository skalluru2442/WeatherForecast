import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private isBrowser: boolean;
  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$: Observable<string | null> = this.errorSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  private handleError(error: GeolocationPositionError) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        this.errorSubject.next('User denied the request for Geolocation.');
        break;
      case error.POSITION_UNAVAILABLE:
        this.errorSubject.next('Location information is unavailable.');
        break;
      case error.TIMEOUT:
        this.errorSubject.next('The request to get user location timed out.');
        break;
      default:
        this.errorSubject.next('An unknown error occurred.');
        break;
    }
    console.error('Geolocation error:', error);
  }

  getCurrentLocation(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (this.isBrowser && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve(position);
          },
          (error) => {
            this.handleError(error);
            reject(error);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        reject(new Error('Geolocation is not available or not supported in this environment.'));
      }
    });
  }
}