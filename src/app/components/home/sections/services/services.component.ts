import { Component, inject } from '@angular/core';
import { I18nService } from '../../../../core/i18n.service';

@Component({
  selector: 'app-home-services',
  standalone: true,
  templateUrl: './services.component.html',
  styleUrl: './services.component.scss'
})
export class HomeServicesComponent {
  readonly i18n = inject(I18nService);
}
