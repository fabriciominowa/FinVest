import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { PlatformComponent } from './components/platform/platform.component';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'platform', component: PlatformComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
