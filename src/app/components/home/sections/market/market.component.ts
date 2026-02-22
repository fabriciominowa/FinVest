import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MarketService } from '../../../../core/market.service';

@Component({
  selector: 'app-home-market',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './market.component.html',
  styleUrl: './market.component.scss'
})
export class HomeMarketComponent {
  readonly market = inject(MarketService);

  readonly trackQuotes = computed(() => {
    const data = this.market.quotes();
    return [...data, ...data];
  });

  abs(v: number): number {
    return Math.abs(v);
  }
}
