import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { I18nService } from '../../core/i18n.service';
import { MarketService, NewsItem, Quote } from '../../core/market.service';

type PageId = 'dashboard' | 'portfolio' | 'transactions' | 'b3' | 'appnews' | 'reports' | 'companies' | 'settings';
type NewsFilter = 'all' | 'B3' | 'Macro' | 'FII';

interface Tx {
  name: string;
  co: string;
  val: string;
  chg: string;
  date: string;
  type: 'buy' | 'sell' | 'pend';
}

interface PortfolioItem {
  ticker: string;
  name: string;
  type: string;
  val: string;
  pct: number;
  chg: number;
  color: string;
}

interface UiNews extends NewsItem {
  tag: 'up' | 'dn' | 'nt';
  cat: 'B3' | 'Macro' | 'FII';
  desc?: string;
}

@Component({
  selector: 'app-platform',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './platform.component.html',
  styleUrl: './platform.component.scss'
})
export class PlatformComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly auth = inject(AuthService);
  readonly router = inject(Router);
  readonly i18n = inject(I18nService);
  readonly market = inject(MarketService);

  readonly activePage = signal<PageId>('dashboard');
  readonly newsFilter = signal<NewsFilter>('all');

  readonly ibovText = computed(() => Math.round(this.market.ibov()).toLocaleString('pt-BR'));
  readonly usdText = computed(() => this.market.usd().toFixed(3).replace('.', ','));

  readonly txs: Tx[] = [
    { name: 'CRI Multiplan 2027', co: 'Multiplan S.A.', val: '+R$ 2,4M', chg: '+0,8%', date: '20/02/26', type: 'buy' },
    { name: 'Debênture ENEV', co: 'ENEVA S.A.', val: '+R$ 5,1M', chg: '+1,2%', date: '19/02/26', type: 'buy' },
    { name: 'Debênture CPFL', co: 'CPFL Energia', val: '-R$ 800K', chg: '-0,6%', date: '19/02/26', type: 'sell' },
    { name: 'CRA Suzano', co: 'Suzano S.A.', val: 'R$ 3,2M', chg: '—', date: '18/02/26', type: 'pend' }
  ];

  readonly portfolio: PortfolioItem[] = [
    { ticker: 'HGLG11', name: 'CSHG Logística FII', type: 'FII · Logístico', val: 'R$ 22,4M', pct: 7.9, chg: +2.1, color: 'var(--gold)' },
    { ticker: 'CRI-MPL', name: 'CRI Multiplan 2027', type: 'CRI · IPCA+6,8%', val: 'R$ 41,2M', pct: 14.5, chg: +0.8, color: 'var(--green)' },
    { ticker: 'KNRI11', name: 'Kinea Renda Imob.', type: 'FII · Híbrido', val: 'R$ 18,6M', pct: 6.5, chg: -0.3, color: 'var(--accent)' },
    { ticker: 'DEB-ENEV', name: 'Debênture ENEV', type: 'Deb. · CDI+1,9%', val: 'R$ 30,1M', pct: 10.6, chg: +1.2, color: 'var(--red)' },
    { ticker: 'CRA-SZN', name: 'CRA Suzano', type: 'CRA · IPCA+5,2%', val: 'R$ 24,8M', pct: 8.7, chg: +0.4, color: 'var(--green)' },
    { ticker: 'MXRF11', name: 'Maxi Renda FII', type: 'FII · CRI/CRA', val: 'R$ 15,2M', pct: 5.3, chg: +1.8, color: 'var(--gold)' }
  ];

  readonly companies = [
    { name: 'Multiplan S.A.', seg: 'Shopping Centers', aum: 'R$ 41M' },
    { name: 'ENEVA S.A.', seg: 'Geração de Energia', aum: 'R$ 30M' },
    { name: 'Suzano S.A.', seg: 'Papel e Celulose', aum: 'R$ 25M' }
  ];

  readonly liveFeed = signal<string[]>([]);
  readonly alerts = signal<string[]>([]);
  readonly toast = signal<{ title: string; msg: string; type: 'ok' | 'warn' | 'info' } | null>(null);
  readonly modal = signal<{ title: string; lines: Array<{ k: string; v: string }> } | null>(null);

  readonly clock = signal('--:--:--');
  readonly sentiment = signal(62);

  readonly stocks = signal<Quote[]>([]);
  readonly fiis = signal<Quote[]>([
    { symbol: 'HGLG11', price: 161.2, changePct: 0.8 },
    { symbol: 'KNRI11', price: 133.4, changePct: -0.2 },
    { symbol: 'MXRF11', price: 10.3, changePct: 0.3 },
    { symbol: 'XPML11', price: 96.8, changePct: -0.1 }
  ]);

  readonly appNews = computed<UiNews[]>(() => {
    const base = this.market.news().map((n, idx) => {
      const cat: UiNews['cat'] = idx % 3 === 0 ? 'B3' : idx % 3 === 1 ? 'Macro' : 'FII';
      const tag: UiNews['tag'] = /cai|queda|recua|baixa/i.test(n.title) ? 'dn' : /sobe|alta|avança|recorde/i.test(n.title) ? 'up' : 'nt';
      return { ...n, cat, tag, desc: 'Atualização de mercado e impacto nos ativos monitorados pela plataforma.' };
    });
    const f = this.newsFilter();
    return f === 'all' ? base : base.filter((n) => n.cat === f);
  });

  private refreshTimer?: number;
  private simTimer?: number;
  private clockTimer?: number;
  private feedTimer?: number;
  private toastTimer?: number;

  async ngOnInit(): Promise<void> {
    await this.market.refresh();
    this.syncMarket();
    this.updateSentimentAndAlerts();
    this.seedFeed();

    this.refreshTimer = window.setInterval(async () => {
      await this.market.refresh();
      this.syncMarket();
      this.updateSentimentAndAlerts();
      this.drawAllCharts();
    }, 60000);

    this.simTimer = window.setInterval(() => this.simulatePrices(), 2500);
    this.clockTimer = window.setInterval(() => this.clock.set(new Date().toLocaleTimeString('pt-BR')), 1000);
    this.feedTimer = window.setInterval(() => this.pushFeed(), 5500);
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.drawAllCharts(), 80);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    if (this.simTimer) clearInterval(this.simTimer);
    if (this.clockTimer) clearInterval(this.clockTimer);
    if (this.feedTimer) clearInterval(this.feedTimer);
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  abs(v: number): number { return Math.abs(v); }

  barWidth(pct: number): number { return Math.min(pct * 7, 100); }

  setPage(id: PageId): void {
    this.activePage.set(id);
    if (id === 'appnews') this.setNewsFilter('all');
    setTimeout(() => this.drawAllCharts(), 50);
  }

  setNewsFilter(f: NewsFilter): void {
    this.newsFilter.set(f);
    setTimeout(() => this.drawSentimentChart(), 20);
  }

  signOut(): void {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }

  openTxModal(tx: Tx): void {
    this.modal.set({
      title: tx.name,
      lines: [
        { k: 'Empresa', v: tx.co },
        { k: 'Valor', v: tx.val },
        { k: 'Rentabilidade', v: tx.chg },
        { k: 'Data', v: tx.date },
        { k: 'Status', v: tx.type.toUpperCase() }
      ]
    });
  }

  openQuoteModal(q: Quote): void {
    this.modal.set({
      title: q.symbol,
      lines: [
        { k: 'Preço', v: `R$ ${q.price.toFixed(2).replace('.', ',')}` },
        { k: 'Variação', v: `${q.changePct >= 0 ? '+' : ''}${q.changePct.toFixed(2)}%` },
        { k: 'Fonte', v: this.market.sourceLabel() }
      ]
    });
  }

  closeModal(): void { this.modal.set(null); }

  saveSettingsToast(): void { this.showToast('SALVO', 'Configurações atualizadas com sucesso.', 'ok'); }

  private syncMarket(): void {
    this.stocks.set(this.market.quotes().length ? this.market.quotes().map((q) => ({ ...q })) : this.stocks());
  }

  private seedFeed(): void {
    this.liveFeed.set([
      'Nova ordem de compra +R$ 1,2M em CRI Multiplan aprovada.',
      'BTG Pactual renovou contrato de custódia por 24 meses.',
      'Alerta: Debênture CPFL abaixo de 97,2% do par.',
      'Cupom recebido: R$ 148K — FII HGLG11.'
    ]);
  }

  private pushFeed(): void {
    const msgs = [
      () => `USD/BRL: R$${this.market.usd().toFixed(3).replace('.', ',')} (${this.market.usdPct().toFixed(2)}%)`,
      () => `IBOV: ${Math.round(this.market.ibov()).toLocaleString('pt-BR')} pts (${this.market.ibovPct().toFixed(2)}%)`,
      () => this.stocks().length ? `${this.stocks()[0].symbol}: R$${this.stocks()[0].price.toFixed(2)} (${this.stocks()[0].changePct.toFixed(2)}%)` : 'Mercado em atualização',
      () => `CDI: ${this.market.cdi().toFixed(2)}% a.a.`
    ];
    const msg = msgs[Math.floor(Math.random() * msgs.length)]();
    this.liveFeed.update((arr) => [msg, ...arr].slice(0, 5));
  }

  private updateSentimentAndAlerts(): void {
    const score = Math.min(95, Math.max(5, Math.round(50 + this.market.ibovPct() * 7 - this.market.usdPct() * 4)));
    this.sentiment.set(score);

    const next = [
      'CPFL debênture abaixo de 97,5% do par — avaliar saída.',
      'Vencimento LCI Itaú em 28 dias — renovar posição?',
      'HGLG11 acima da meta mensal de retorno.'
    ];
    if (this.market.usd() > 5.9) next.push('Dólar acima de R$5,90 — revisar hedge cambial.');
    this.alerts.set(next);
  }

  private simulatePrices(): void {
    this.stocks.update((items) => items.map((s) => ({
      ...s,
      price: s.price + s.price * (Math.random() - 0.5) * 0.0008,
      changePct: s.changePct + (Math.random() - 0.5) * 0.05
    })));

    this.fiis.update((items) => items.map((f) => ({
      ...f,
      price: f.price + f.price * (Math.random() - 0.5) * 0.0005,
      changePct: f.changePct + (Math.random() - 0.5) * 0.04
    })));

    this.drawIbovChart();
  }

  private showToast(title: string, msg: string, type: 'ok' | 'warn' | 'info'): void {
    this.toast.set({ title, msg, type });
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toast.set(null), 4500);
  }

  private drawAllCharts(): void {
    this.drawPerfChart();
    this.drawDonutChart();
    this.drawIbovChart();
    this.drawSentimentChart();
    this.drawBarChart();
    this.drawVarChart();
  }

  private drawPerfChart(): void {
    this.drawLine('chart-perf', [0,.8,1.2,.9,2.1,1.8,3.2,2.8,4.5,4.1,5.8,6.2,5.9,7.4,8.1,7.8,9.4,10.2,9.8,11.3,12,11.7,13.4,14.1,13.8,15.2,16,15.7,17.2,18.4], '#c9a84c', 170);
  }

  private drawDonutChart(): void {
    const c = document.getElementById('chart-donut') as HTMLCanvasElement | null;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = 140 * dpr;
    c.height = 140 * dpr;
    ctx.scale(dpr, dpr);
    const cx = 70, cy = 70, r = 52, ir = 36;
    let start = -Math.PI / 2;
    [
      { v: 35, c: '#c9a84c' },
      { v: 25, c: '#4a9eff' },
      { v: 22, c: '#22c55e' },
      { v: 18, c: 'rgba(255,255,255,.18)' }
    ].forEach((s) => {
      const a = (s.v / 100) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, start + a);
      ctx.closePath();
      ctx.fillStyle = s.c;
      ctx.fill();
      start += a;
    });
    ctx.beginPath();
    ctx.arc(cx, cy, ir, 0, Math.PI * 2);
    ctx.fillStyle = '#12141e';
    ctx.fill();
    ctx.fillStyle = '#e2e8f0';
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px Playfair Display, Georgia, serif';
    ctx.fillText('R$284M', cx, cy + 4);
    ctx.fillStyle = 'rgba(255,255,255,.4)';
    ctx.font = '9px IBM Plex Mono, monospace';
    ctx.fillText('AUM', cx, cy + 18);
  }

  private drawIbovChart(): void {
    const base = this.market.ibov();
    const series = Array.from({ length: 80 }, (_, i) => base + Math.sin(i / 8) * 400 + (Math.random() - 0.5) * 120);
    this.drawLine('chart-ibov', series, this.market.ibovPct() >= 0 ? '#22c55e' : '#ef4444', 140);
  }

  private drawSentimentChart(): void {
    this.drawBars('chart-sentiment', [
      { label: 'B3', value: Math.min(95, Math.max(5, Math.round(50 + this.market.ibovPct() * 8))), color: '#c9a84c' },
      { label: 'Macro', value: Math.min(95, Math.max(5, Math.round(55 - this.market.usdPct() * 5))), color: '#4a9eff' },
      { label: 'FII', value: 80, color: '#22c55e' },
      { label: 'Global', value: 62, color: '#e8c96d' },
      { label: 'Câmbio', value: Math.min(95, Math.max(5, Math.round(50 - this.market.usdPct() * 10))), color: '#ef4444' }
    ], 160);
  }

  private drawBarChart(): void {
    this.drawColumns('chart-bar', [2.1, 3.4, 1.8, 2.9, 4.2, 3.1], '#c9a84c', 160);
  }

  private drawVarChart(): void {
    const data = Array.from({ length: 50 }, () => {
      let v = 0;
      for (let j = 0; j < 12; j += 1) v += Math.random() - 0.5;
      return v * 2.5;
    });
    this.drawLine('chart-var', data, '#4a9eff', 160);
  }

  private drawLine(id: string, data: number[], color: string, height: number): void {
    const c = document.getElementById(id) as HTMLCanvasElement | null;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const W = c.offsetWidth || 300;
    const H = height;
    c.width = W * dpr;
    c.height = H * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const min = Math.min(...data);
    const max = Math.max(...data);
    const toX = (i: number) => 24 + (i / (data.length - 1)) * (W - 38);
    const toY = (v: number) => H - 20 - ((v - min) / ((max - min) || 1)) * (H - 38);

    ctx.strokeStyle = 'rgba(255,255,255,.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i += 1) {
      const y = 16 + i * ((H - 34) / 3);
      ctx.beginPath();
      ctx.moveTo(16, y);
      ctx.lineTo(W - 10, y);
      ctx.stroke();
    }

    ctx.beginPath();
    data.forEach((v, i) => { if (i === 0) ctx.moveTo(toX(i), toY(v)); else ctx.lineTo(toX(i), toY(v)); });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  private drawBars(id: string, bars: Array<{ label: string; value: number; color: string }>, height: number): void {
    const c = document.getElementById(id) as HTMLCanvasElement | null;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const W = c.offsetWidth || 340;
    const H = height;
    c.width = W * dpr;
    c.height = H * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const rowH = (H - 30) / bars.length;
    bars.forEach((b, i) => {
      const y = 15 + i * rowH;
      const width = (b.value / 100) * (W - 110);
      ctx.fillStyle = 'rgba(255,255,255,.06)';
      ctx.fillRect(80, y + rowH * 0.18, W - 100, rowH * 0.6);
      ctx.fillStyle = b.color;
      ctx.fillRect(80, y + rowH * 0.18, width, rowH * 0.6);
      ctx.fillStyle = 'rgba(255,255,255,.5)';
      ctx.font = '10px IBM Plex Mono, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(b.label, 74, y + rowH * 0.62);
      ctx.fillStyle = b.color;
      ctx.textAlign = 'left';
      ctx.fillText(`${b.value}%`, 86 + width, y + rowH * 0.62);
    });
  }

  private drawColumns(id: string, data: number[], color: string, height: number): void {
    const c = document.getElementById(id) as HTMLCanvasElement | null;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const W = c.offsetWidth || 340;
    const H = height;
    c.width = W * dpr;
    c.height = H * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const max = Math.max(...data, 1);
    const bw = Math.max(12, (W - 70) / data.length - 8);
    data.forEach((v, i) => {
      const x = 30 + i * (bw + 8);
      const h = (v / max) * (H - 35);
      ctx.fillStyle = color;
      ctx.fillRect(x, H - 20 - h, bw, h);
    });
  }
}

