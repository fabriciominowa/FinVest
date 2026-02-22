import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { I18nService } from '../../core/i18n.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  readonly auth = inject(AuthService);
  readonly router = inject(Router);
  readonly i18n = inject(I18nService);

  email = 'gestor@finvest.com.br';
  pass = 'finvest123';
  readonly error = signal(false);

  submit(): void {
    const ok = this.auth.login(this.email, this.pass);
    this.error.set(!ok);
    if (ok) this.router.navigateByUrl('/platform');
  }
}
