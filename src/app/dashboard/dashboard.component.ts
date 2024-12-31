import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { LocationService } from '../services/location.service';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { ApiService } from '../services/api.service';
import { CurrentWeather, dayWeather } from '../models/currentWether';
import { CommonModule, DatePipe } from '@angular/common';
import { ThemeService } from '../services/theme.service';
import Chart, { ChartConfiguration } from 'chart.js/auto';
import { BookmarkService } from '../services/bookmarks.service';
import { FoursquareVenue } from '../models/nearByPlaces';
import { LoaderComponent } from '../loader/loader.component';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ErrorAlertComponent } from '../error-alert/error-alert.component';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, LoaderComponent, MatDialogModule, MatTooltipModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  providers: [DatePipe]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private locationService = inject(LocationService);
  public themeService = inject(ThemeService);
  private cdr = inject(ChangeDetectorRef);
  private bookmarkService = inject(BookmarkService);
  private datePipe = inject(DatePipe);

  searchForm: FormGroup = this.fb.group({
    city: ['', [Validators.required]]
  });

  latitude!: number;
  longitude!: number;
  errorMessage!: string;
  private destroy$ = new Subject<void>();

  currentWeatherData: CurrentWeather = this.initializeCurrentWeather();
  chartInstance: Chart | null = null;
  chartInstance5Day: Chart | null = null;

  timeLabels: string[] = [];
  temperatures: number[] = [];
  timeLabels5Day: string[] = [];
  temperatures5Day: number[] = [];
  currentCity: string = '';
  currentCityLat!: number;
  currentCityLong!: number;
  locations: string[] = this.bookmarkService.getBookmarks();
  nearbyPlacesWeather: CurrentWeather[] = [this.initializeCurrentWeather()];
  nearByPlacesList: FoursquareVenue[] = [];
  isLoading: boolean = false;
  private subscriptions: Subscription[] = [];
  matDialogRef!: MatDialogRef<ErrorAlertComponent>;
  matDialog = inject(MatDialog);
  selectLocation = "";

  ngOnInit(): void {
    this.locationService.getCurrentLocation().then(
      coords => {
        if (coords) {
          const { latitude, longitude } = coords.coords;
          this.latitude = latitude;
          this.longitude = longitude;
          this.currentCityLat = latitude;
          this.currentCityLong = longitude;
          this.nearbyPlacesWeather = [];
          this.fetchNearbyPlaces(latitude, longitude);
          this.fetchCurrentWeather();
        } else {
          this.fetchWeatherByCity("Hyderabad");
        }
      },
      error => {
        console.error(error);
        this.fetchWeatherByCity("Hyderabad");
      }
    );
  }

  fetchNearbyPlaces(lat: number, lon: number): void {
    const subscription = this.apiService.getNearByPlacesList(lat, lon)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.nearByPlacesList = res.results;
          this.getWeatherForNearbyPlacesList(this.nearByPlacesList);
        },
        error: err => {
          console.log(err);
        }
      });
    this.subscriptions.push(subscription);
  }

  getWeatherForNearbyPlacesList(places: FoursquareVenue[]): void {
    places.forEach(place => {
      const lat = place.geocodes.main.latitude;
      const lon = place.geocodes.main.longitude;
      if (lat && lon) this.fetchWeatherForNearbyPlace(lat, lon);
    });
  }

  fetchWeatherForNearbyPlace(lat: number, lon: number): void {
    const subscription = this.apiService.getCurrentWeather(lat, lon)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.nearbyPlacesWeather.push(res);
        },
        error: error => console.error('Error fetching weather:', error)
      });
    this.subscriptions.push(subscription);
  }

  fetchCurrentWeather(): void {
    this.isLoading = true;
    const subscription = this.apiService.getCurrentWeather(this.latitude, this.longitude)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.currentWeatherData = res;
          this.currentCity = res.name;
          this.searchForm.get('city')?.setValue(res.name);
          this.fetchHourlyWeather();
          this.fetchFiveDayWeather();
          this.isLoading = false;
        },
        error: error => {
          console.error(error);
          this.isLoading = false;
        }
      });
    this.subscriptions.push(subscription);
  }

  fetchHourlyWeather(): void {
    const subscription = this.apiService.getHourlyForecast(this.latitude, this.longitude, 8)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.populateWeatherData(res.list, this.temperatures, this.timeLabels);
          this.renderChart('lineChart', this.temperatures, this.timeLabels);
        },
        error: error => console.error(error)
      });
    this.subscriptions.push(subscription);
  }

  fetchFiveDayWeather(): void {
    const subscription = this.apiService.getHourlyForecast(this.latitude, this.longitude)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.populateWeatherData(res.list, this.temperatures5Day, this.timeLabels5Day);
          this.renderChart('lineChart5Day', this.temperatures5Day, this.timeLabels5Day);
        },
        error: error => console.error(error)
      });
    this.subscriptions.push(subscription);
  }

  populateWeatherData(list: dayWeather[], temperatures: number[], timeLabels: string[]): void {
    list.forEach(data => {
      temperatures.push(data.main.temp - 273.15);
      timeLabels.push(data.dt_txt);
    });
  }

  renderChart(chartId: string, temperatures: number[], timeLabels: string[]): void {
    const ctx = document.getElementById(chartId) as HTMLCanvasElement;
    const labelColor = getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim();
    const legendColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
    let timeLabelsnew: string[] = [];
    if (timeLabels.length === 8) {
      timeLabelsnew = timeLabels.map(dateString =>
        this.datePipe.transform(dateString, 'HH:mm') || ''
      )
    } else {
      timeLabelsnew = timeLabels.map(dateString =>
        this.datePipe.transform(dateString, 'yyyy-MM-dd') || ''
      );
    }
    const chartConfig: ChartConfiguration<'line', number[], string> = {
      type: 'line',
      data: {
        labels: timeLabelsnew,
        datasets: [{
          label: 'Temperature (°C)',
          data: temperatures,
          borderColor: labelColor,
          backgroundColor: legendColor,
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: labelColor,
          pointBorderColor: '#fff',
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: legendColor }, display: false } },
        scales: {
          x: { ticks: { color: labelColor }, grid: { display: false } },
          y: { ticks: { color: labelColor }, grid: { color: 'rgba(255, 255, 255, 0.1)' } }
        }
      }
    };

    if (chartId === 'lineChart') {
      this.chartInstance?.destroy();
      this.chartInstance = new Chart(ctx, chartConfig);
    } else {
      this.chartInstance5Day?.destroy();
      this.chartInstance5Day = new Chart(ctx, chartConfig);
    }
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
    this.resetCharts();
  }

  resetCharts(): void {
    this.chartInstance?.destroy();
    this.chartInstance5Day?.destroy();
    this.renderChart('lineChart', this.temperatures, this.timeLabels);
    this.renderChart('lineChart5Day', this.temperatures5Day, this.timeLabels5Day);
    this.cdr.detectChanges();
  }

  onSearch(): void {
    if (this.searchForm.valid) {
      const city = this.searchForm.value.city;
      this.fetchWeatherByCity(city);
      // this.searchForm.reset();
    }
  }

  fetchWeatherByCity(city: string): void {
    this.isLoading = true;
    const subscription = this.apiService.getCurrentWeatherByCity(city)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.isLoading = false;
          this.currentWeatherData = res;
          this.currentCity = res.name;
          this.currentCityLat = res.coord.lat;
          this.currentCityLong = res.coord.lon;
          this.nearbyPlacesWeather = [];
          this.fetchNearbyPlaces(this.currentCityLat, this.currentCityLong);
          this.fetchHourlyWeatherByCity(city);
          this.fetchFiveDayWeatherByCity(city);
        },
        error: error => {
          this.isLoading = false;
          this.ErrorAlert("Weather Forecast", error.error.message);
        }
      });
    this.subscriptions.push(subscription);
  }

  fetchHourlyWeatherByCity(city: string): void {
    const subscription = this.apiService.getHourlyForecastByCity(city, 8)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.resetChartData(this.temperatures, this.timeLabels);
          this.populateWeatherData(res.list, this.temperatures, this.timeLabels);
          this.renderChart('lineChart', this.temperatures, this.timeLabels);
        },
        error: error => {
          this.isLoading = false;
          this.ErrorAlert("Weather Forecast", error.error.message);
        }
      });
    this.subscriptions.push(subscription);
  }

  fetchFiveDayWeatherByCity(city: string): void {
    const subscription = this.apiService.getHourlyForecastByCity(city)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.resetChartData(this.temperatures5Day, this.timeLabels5Day);
          this.populateWeatherData(res.list, this.temperatures5Day, this.timeLabels5Day);
          this.renderChart('lineChart5Day', this.temperatures5Day, this.timeLabels5Day);
        },
        error: error => {
          this.isLoading = false;
          this.ErrorAlert("Weather Forecast", error.error.message);
        }
      });
    this.subscriptions.push(subscription);
  }

  resetChartData(temperatures: number[], timeLabels: string[]): void {
    temperatures.length = 0;
    timeLabels.length = 0;
  }

  initializeCurrentWeather(): CurrentWeather {
    return {
      weather: [
        {
          id: 0,
          main: '',
          description: '',
          icon: ''
        }
      ],
      coord: { lon: 0, lat: 0 },
      main: {
        temp: 0,
        feels_like: 0,
        temp_min: 0,
        temp_max: 0,
        pressure: 0,
        humidity: 0,
        sea_level: 0,
        grnd_level: 0,
      },
      base: '',
      visibility: 0,
      wind: { speed: 0, deg: 0 },
      clouds: { all: '' },
      dt: 0,
      sys: { type: 0, id: 0, country: '', sunrise: 0, sunset: 0 },
      timezone: 0,
      id: 0,
      name: '',
      code: 0,
    };
  }

  initializeNearbyPlacesWeather(count: number): CurrentWeather[] {
    return Array(count).fill(null).map(() => this.initializeCurrentWeather());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.chartInstance?.destroy();
    this.chartInstance5Day?.destroy();
  }

  AddToBookmarks() {
    if (this.locations.length >= 10) {
      this.ErrorAlert("Bookmarks", 'You can bookmark maximum 10 loactions');
    } else if (this.locations.includes(this.currentCity)) {
      this.ErrorAlert("Bookmarks", 'This location already bookmarked!');
    } else {
      this.bookmarkService.addBookmark(this.currentCity);
      this.locations = this.bookmarkService.getBookmarks();
      this.ErrorAlert("Bookmarks", 'This location bookmarked successfully!');
    }
  }

  openWeatherForBookmark(i: number) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const city = this.locations[i];
    this.fetchWeatherByCity(city);
  }

  deleteBookmark(city: string) {
    this.bookmarkService.deleteBookmark(city);
    this.locations = this.bookmarkService.getBookmarks();
    this.ErrorAlert("Bookmarks", 'Removed from bookmarks successfully!');
    this.selectLocation = "";
  }

  ErrorAlert(header: string, message: String) {
    this.matDialogRef = this.matDialog.open(ErrorAlertComponent, {
      data: { header: header, message: message },
      disableClose: false,
    });
  }

  isCityBookmarked(cityName: string): boolean {
    return this.locations.includes(cityName);
  }

  onLocationChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    let selectedValue = selectElement.value;
    if (selectedValue != "") {
      this.searchForm.get('city')?.setValue(selectedValue);
      this.fetchWeatherByCity(selectedValue);
    }
  }

}
