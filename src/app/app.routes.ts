import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '', pathMatch: 'full', redirectTo: 'home'
    },
    {
        path: 'home',
        loadComponent: () => import('./dashboard/dashboard.component').then((m) => m.DashboardComponent)
    }
];
