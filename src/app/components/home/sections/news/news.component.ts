import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarketService } from '../../../../core/market.service';

@Component({
  selector: 'app-home-news',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './news.component.html',
  styleUrl: './news.component.scss'
})
export class HomeNewsComponent {
  readonly market = inject(MarketService);
}
