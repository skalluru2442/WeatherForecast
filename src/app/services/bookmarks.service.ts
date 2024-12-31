import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class BookmarkService {
  private storageKey = 'locations';
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  getBookmarks(): string[] {
    if (this.isBrowser) {
      const storedLocations = localStorage.getItem(this.storageKey);
      return storedLocations ? JSON.parse(storedLocations) : [];
    }
    return [];
  }

  addBookmark(location: string): void {
    if (this.isBrowser) {
      const locations = this.getBookmarks();
      location = location.trim();
      if (location && !locations.includes(location)) {
        locations.push(location);
        this.updateBookmarksInStorage(locations);
      } else {
        console.log('This location already exists or is invalid!');
      }
    }
  }

  deleteBookmark(city: string): void {
    if (this.isBrowser) {
      let locations = this.getBookmarks();
      locations = locations.filter(i => i !== city);
      this.updateBookmarksInStorage(locations);
    }
  }

  private updateBookmarksInStorage(locations: string[]): void {
    if (this.isBrowser) {
      localStorage.setItem(this.storageKey, JSON.stringify(locations));
    }
  }
}
