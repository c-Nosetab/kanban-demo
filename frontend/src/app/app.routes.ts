import { Routes } from '@angular/router';
import { BoardComponent } from './components/board/board.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: BoardComponent },
  { path: '**', redirectTo: '/dashboard' }
];
