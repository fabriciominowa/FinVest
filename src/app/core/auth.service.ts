import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly isLoggedIn = signal(false);
  readonly userName = signal('Gustavo Faria');

  login(email: string, pass: string): boolean {
    const ok = email.trim().toLowerCase() === 'gestor@finvest.com.br' && pass === 'finvest123';
    this.isLoggedIn.set(ok);
    return ok;
  }

  logout(): void {
    this.isLoggedIn.set(false);
  }
}
