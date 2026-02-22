import { Injectable, signal } from '@angular/core';

export interface Quote {
  symbol: string;
  price: number;
  changePct: number;
}

export interface NewsItem {
  source: string;
  title: string;
  when: string;
}

const FALLBACK_QUOTES: Quote[] = [
  { symbol: 'PETR4', price: 38.4, changePct: 1.2 },
  { symbol: 'VALE3', price: 62.1, changePct: -0.3 },
  { symbol: 'ITUB4', price: 34.4, changePct: 0.6 },
  { symbol: 'BBDC4', price: 14.8, changePct: -0.1 }
];

const FALLBACK_NEWS: NewsItem[] = [
  { source: 'Bloomberg Brasil', title: 'Ibovespa fecha em alta com fluxo estrangeiro positivo', when: 'há 18 min' },
  { source: 'Valor', title: 'Petrobras lidera ganhos após atualização de guidance', when: 'há 42 min' },
  { source: 'Banco Central', title: 'Mercado ajusta expectativas para trajetória da Selic', when: 'há 1h' }
];

@Injectable({ providedIn: 'root' })
export class MarketService {
  private readonly brapiToken = this.readBrapiToken();

  readonly ibov = signal<number>(129000);
  readonly ibovPct = signal<number>(0.45);
  readonly usd = signal<number>(5.74);
  readonly usdPct = signal<number>(-0.2);
  readonly cdi = signal<number>(12.25);
  readonly quotes = signal<Quote[]>(FALLBACK_QUOTES);
  readonly news = signal<NewsItem[]>(FALLBACK_NEWS);
  readonly sourceLabel = signal('fallback');

  async refresh(): Promise<void> {
    const tasks: Array<Promise<void>> = [this.loadFx(), this.loadHG(), this.loadNews()];
    if (this.brapiToken) {
      tasks.push(this.loadBrapi());
    } else {
      this.quotes.set(FALLBACK_QUOTES);
    }
    await Promise.allSettled(tasks);

    // Safety net: never leave UI empty.
    if (!this.quotes().length) this.quotes.set(FALLBACK_QUOTES);
    if (!this.news().length) this.news.set(FALLBACK_NEWS);
  }

  private async loadFx(): Promise<void> {
    try {
      const r = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL', { signal: AbortSignal.timeout(8000) });
      if (!r.ok) throw new Error(`AwesomeAPI ${r.status}`);

      const d = await r.json();
      const bid = Number(d?.USDBRL?.bid);
      const pct = Number(d?.USDBRL?.pctChange);
      if (!Number.isFinite(bid) || !Number.isFinite(pct)) throw new Error('AwesomeAPI payload inválido');

      this.usd.set(bid);
      this.usdPct.set(pct);
      this.sourceLabel.set('awesomeapi');
    } catch {
      this.sourceLabel.set('fallback');
    }
  }

  private async loadHG(): Promise<void> {
    try {
      const r = await fetch('https://api.hgbrasil.com/finance?format=json-cors', { signal: AbortSignal.timeout(8000) });
      if (!r.ok) throw new Error(`HG ${r.status}`);

      const d = await r.json();
      const res = d?.results;
      const cdiTax = (res?.taxes || []).find((x: { cdi?: number }) => typeof x.cdi === 'number');
      if (typeof cdiTax?.cdi === 'number') this.cdi.set(cdiTax.cdi);

      if (typeof res?.stocks?.IBOVESPA?.price === 'number') {
        this.ibov.set(res.stocks.IBOVESPA.price);
        this.ibovPct.set(Number(res.stocks.IBOVESPA.variation ?? this.ibovPct()));
      }
    } catch {
      // Keep fallback values.
    }
  }

  private async loadBrapi(): Promise<void> {
    if (!this.brapiToken) {
      this.quotes.set(FALLBACK_QUOTES);
      return;
    }

    try {
      const r = await fetch('https://brapi.dev/api/quote/PETR4,VALE3,ITUB4,BBDC4?range=1d&interval=1d&fundamental=false', {
        headers: { Authorization: `Bearer ${this.brapiToken}` },
        signal: AbortSignal.timeout(10000)
      });
      if (!r.ok) throw new Error(`Brapi ${r.status}`);

      const d = await r.json();
      const mapped: Quote[] = (d?.results || [])
        .map((x: any) => ({
          symbol: String(x?.symbol || ''),
          price: Number(x?.regularMarketPrice),
          changePct: Number(x?.regularMarketChangePercent)
        }))
        .filter((q: Quote) => q.symbol && Number.isFinite(q.price) && Number.isFinite(q.changePct));

      if (!mapped.length) throw new Error('Brapi sem resultados válidos');

      this.quotes.set(mapped);
      this.sourceLabel.set('brapi');
    } catch {
      this.quotes.set(FALLBACK_QUOTES);
    }
  }

  private readBrapiToken(): string {
    const env = (globalThis as { __env?: { BRAPI_TOKEN?: string } }).__env;
    return String(env?.BRAPI_TOKEN || '').trim();
  }

  private async loadNews(): Promise<void> {
    try {
      const feedUrl = encodeURIComponent('https://feeds.feedburner.com/infomoney/ULrk');
      const proxies = [
        `https://api.allorigins.win/get?url=${feedUrl}`,
        `https://api.codetabs.com/v1/proxy?quest=https://feeds.feedburner.com/infomoney/ULrk`
      ];

      let xmlText = '';
      for (const url of proxies) {
        try {
          const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
          if (!r.ok) continue;

          if (url.includes('allorigins')) {
            const d = await r.json();
            xmlText = String(d?.contents || '');
          } else {
            xmlText = await r.text();
          }

          if (xmlText.includes('<item>')) break;
        } catch {
          // Try next proxy.
        }
      }

      if (!xmlText.includes('<item>')) throw new Error('RSS indisponível');

      const xml = new DOMParser().parseFromString(xmlText, 'text/xml');
      const items = Array.from(xml.querySelectorAll('item'))
        .slice(0, 4)
        .map((n) => ({
          source: 'InfoMoney',
          title: n.querySelector('title')?.textContent?.trim() || 'Sem título',
          when: 'agora'
        }))
        .filter((n) => !!n.title);

      if (!items.length) throw new Error('RSS sem itens');
      this.news.set(items);
    } catch {
      this.news.set(FALLBACK_NEWS);
    }
  }
}
