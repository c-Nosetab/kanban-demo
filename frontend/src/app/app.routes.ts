import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./components/board/board').then(m => m.BoardComponent)
  },
  { path: '**', redirectTo: '/dashboard' }
];
