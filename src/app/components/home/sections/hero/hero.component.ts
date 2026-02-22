import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MarketService } from '../../../../core/market.service';

@Component({
  selector: 'app-home-hero',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss'
})
export class HomeHeroComponent {
  readonly market = inject(MarketService);

  readonly heroQuotes = computed(() => this.market.quotes().slice(0, 4));

  price(v: number): string {
    return v.toFixed(2).replace('.', ',');
  }

  pct(v: number): string {
    return `${v >= 0 ? '▲' : '▼'} ${Math.abs(v).toFixed(2)}%`;
  }
}
