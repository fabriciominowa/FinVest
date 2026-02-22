import { AfterViewInit, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { HomeNavbarComponent } from './sections/navbar/navbar.component';
import { HomeHeroComponent } from './sections/hero/hero.component';
import { HomeServicesComponent } from './sections/services/services.component';
import { HomeProductsComponent } from './sections/products/products.component';
import { HomeMarketComponent } from './sections/market/market.component';
import { HomeContactComponent } from './sections/contact/contact.component';
import { HomeNumbersComponent } from './sections/numbers/numbers.component';
import { HomeAboutComponent } from './sections/about/about.component';
import { HomeNewsComponent } from './sections/news/news.component';
import { HomeTeamComponent } from './sections/team/team.component';
import { HomeFooterComponent } from './sections/footer/footer.component';
import { MarketService } from '../../core/market.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HomeNavbarComponent,
    HomeHeroComponent,
    HomeServicesComponent,
    HomeNumbersComponent,
    HomeAboutComponent,
    HomeProductsComponent,
    HomeNewsComponent,
    HomeTeamComponent,
    HomeMarketComponent,
    HomeContactComponent,
    HomeFooterComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly market = inject(MarketService);
  private revealObserver?: IntersectionObserver;

  async ngOnInit(): Promise<void> {
    await this.market.refresh();
  }

  ngAfterViewInit(): void {
    this.revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.reveal').forEach((node) => this.revealObserver?.observe(node));
  }

  ngOnDestroy(): void {
    this.revealObserver?.disconnect();
  }
}
