import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private isDarkMode = false;

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    document.documentElement.classList.toggle('dark-mode', this.isDarkMode);
  }

  setDarkMode(isDark: boolean): void {
    this.isDarkMode = isDark;
    document.documentElement.classList.toggle('dark-mode', isDark);
  }

  getCurrentMode(): boolean {
    return this.isDarkMode;
  }
}
