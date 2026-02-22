const S = {
  ibov: null,
  usd: null,
  eur: null,
  cdi: null,
  selic: null,
  stocks: [],
  fiis: [],
  news: [],
  ibovHistory: [],
  apis: { brapi: 'loading', hg: 'loading', awesome: 'loading', alpha: 'loading', rss: 'loading' }
};

const USERS = [{ email: 'gestor@finvest.com.br', pass: 'finvest123', name: 'Gustavo Faria', role: 'Gestor Sênior' }];
const TICKER_STOCKS = 'PETR4,VALE3,ITUB4,BBDC4,ABEV3,WEGE3,RENT3,RAIL3';
const TICKER_FIIS = 'HGLG11,KNRI11,MXRF11,XPML11,VISC11,BTLG11';

const TXS = [
  { name: 'CRI Multiplan 2027', co: 'Multiplan S.A.', val: '+R$ 2,4M', chg: '+0,8%', date: '20/02/26', type: 'buy' },
  { name: 'Debênture ENEV', co: 'ENEVA S.A.', val: '+R$ 5,1M', chg: '+1,2%', date: '19/02/26', type: 'buy' },
  { name: 'FII HGLG11', co: 'Credit Suisse', val: '+R$ 1,1M', chg: '+2,1%', date: '18/02/26', type: 'buy' },
  { name: 'CRA Suzano 2026', co: 'Suzano S.A.', val: 'R$ 3,2M', chg: '—', date: '18/02/26', type: 'pend' }
];

const PORTFOLIO_ASSETS = [
  { ticker: 'HGLG11', name: 'CSHG Logística FII', type: 'FII · Logístico', val: 'R$ 22,4M', pct: 7.9, chg: +2.1, c: 'var(--gold)' },
  { ticker: 'CRI-MPL', name: 'CRI Multiplan 2027', type: 'CRI · IPCA+6,8%', val: 'R$ 41,2M', pct: 14.5, chg: +0.8, c: 'var(--green)' },
  { ticker: 'KNRI11', name: 'Kinea Renda Imob.', type: 'FII · Híbrido', val: 'R$ 18,6M', pct: 6.5, chg: -0.3, c: 'var(--accent)' }
];

const COMPANIES = [
  { n: 'Multiplan S.A.', s: 'Shopping Centers', aum: 'R$ 41M', ativos: 3, c: '#1a3a5c', i: 'MP' },
  { n: 'ENEVA S.A.', s: 'Geração de Energia', aum: 'R$ 30M', ativos: 2, c: '#1a3320', i: 'EV' },
  { n: 'Suzano S.A.', s: 'Papel e Celulose', aum: 'R$ 25M', ativos: 1, c: '#2a2a1a', i: 'SZ' }
];

const FALLBACK_NEWS = [
  { title: 'Ibovespa avança com fluxo estrangeiro positivo', source: 'Bloomberg Brasil', time: 'há 12 min', tag: 'up', cat: 'B3', desc: 'O índice registrou alta com commodities e bancos.' },
  { title: 'COPOM mantém Selic em 13,75% a.a.', source: 'Banco Central', time: 'há 1h', tag: 'nt', cat: 'Macro', desc: 'Comunicado menciona atividade econômica resiliente.' },
  { title: 'HGLG11 anuncia nova aquisição logística', source: 'InfoMoney', time: 'há 2h', tag: 'up', cat: 'FII', desc: 'Imóvel está 100% locado para operação de varejo.' }
];

function el(id) { return document.getElementById(id); }
function fmt(v, d = 2) { return Number(v || 0).toFixed(d).replace('.', ','); }

function setApiStatus(name, status) {
  S.apis[name] = status;
  const dot = el(`dot-${name}`);
  if (dot) dot.className = `sb2-dot ${status}`;
  const pill = el(`apill-${name}`);
  if (pill) pill.className = `api-pill ${status}`;
}

function timeAgo(date) {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `há ${diff} seg`;
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  return `há ${Math.floor(diff / 3600)}h`;
}

function fmtVol(v) {
  if (!v) return '—';
  if (v >= 1e9) return `R$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `R$${(v / 1e6).toFixed(0)}M`;
  return `R$${(v / 1e3).toFixed(0)}K`;
}

async function fetchAwesome() {
  try {
    const r = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL', { signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error(String(r.status));
    const d = await r.json();
    S.usd = { bid: +d.USDBRL.bid, pct: +d.USDBRL.pctChange };
    S.eur = { bid: +d.EURBRL.bid, pct: +d.EURBRL.pctChange };
    setApiStatus('awesome', 'ok');
    updateCurrencyUI();
    return true;
  } catch {
    S.usd = { bid: 5.742, pct: -0.21 };
    S.eur = { bid: 6.04, pct: 0.12 };
    setApiStatus('awesome', 'err');
    updateCurrencyUI();
    return false;
  }
}

async function fetchHG() {
  try {
    const r = await fetch('https://api.hgbrasil.com/finance?format=json-cors', { signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error(String(r.status));
    const d = await r.json();
    const res = d.results || {};
    const cdiRow = (res.taxes || []).find((t) => t.cdi);
    const selicRow = (res.taxes || []).find((t) => t.selic);
    S.cdi = cdiRow?.cdi || 12.25;
    S.selic = selicRow?.selic || 13.75;
    if (res.stocks?.IBOVESPA) S.ibov = { price: res.stocks.IBOVESPA.price, variation: res.stocks.IBOVESPA.variation };
    setApiStatus('hg', 'ok');
    updateMacroUI();
    return true;
  } catch {
    S.cdi = 12.25;
    S.selic = 13.75;
    setApiStatus('hg', 'err');
    updateMacroUI();
    return false;
  }
}

async function fetchBrapi() {
  let ok = false;
  try {
    const r = await fetch(`https://brapi.dev/api/quote/${TICKER_STOCKS}?range=1d&interval=1d&fundamental=false`, { signal: AbortSignal.timeout(12000) });
    if (!r.ok) throw new Error(String(r.status));
    const d = await r.json();
    if (d.results) {
      S.stocks = d.results.map((s) => ({ ticker: s.symbol, name: s.longName || s.shortName || s.symbol, price: s.regularMarketPrice, chg: s.regularMarketChangePercent, vol: fmtVol(s.regularMarketVolume) }));
      ok = true;
    }
  } catch {
    S.stocks = [{ ticker: 'PETR4', name: 'Petrobras PN', price: 38.4, chg: 1.2, vol: 'R$1B' }];
  }

  try {
    const r = await fetch(`https://brapi.dev/api/quote/${TICKER_FIIS}?fundamental=false`, { signal: AbortSignal.timeout(12000) });
    if (!r.ok) throw new Error(String(r.status));
    const d = await r.json();
    if (d.results) {
      S.fiis = d.results.map((f) => ({ ticker: f.symbol, name: f.longName || f.shortName || f.symbol, price: f.regularMarketPrice, chg: f.regularMarketChangePercent, dy: f.dividendsYield ? `${(f.dividendsYield * 100).toFixed(2)}%` : '—' }));
      ok = true;
    }
  } catch {
    S.fiis = [{ ticker: 'HGLG11', name: 'CSHG Logística', price: 161.2, chg: 0.8, dy: '8.9%' }];
  }

  if (!S.ibov) {
    try {
      const r = await fetch('https://brapi.dev/api/quote/%5EBVSP', { signal: AbortSignal.timeout(8000) });
      const d = await r.json();
      if (d.results?.[0]) S.ibov = { price: d.results[0].regularMarketPrice, variation: d.results[0].regularMarketChangePercent };
    } catch {
      S.ibov = { price: 129100, variation: 0.42 };
    }
  }

  setApiStatus('brapi', ok ? 'ok' : 'err');
  renderTickers();
  updateHeroMarket();
  updateIbovUI();
  return ok;
}

async function fetchNews() {
  const feeds = [
    { url: 'https://feeds.feedburner.com/infomoney/ULrk', source: 'InfoMoney', cat: 'B3' },
    { url: 'https://www.sunoresearch.com.br/feed/', source: 'Suno Research', cat: 'FII' }
  ];
  const items = [];

  try {
    for (const feed of feeds) {
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(feed.url)}`;
      const r = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
      if (!r.ok) continue;
      const d = await r.json();
      const xml = new DOMParser().parseFromString(d.contents, 'text/xml');
      xml.querySelectorAll('item').forEach((it, i) => {
        if (i > 3) return;
        const title = it.querySelector('title')?.textContent || '';
        const desc = (it.querySelector('description')?.textContent || '').replace(/<[^>]*>/g, '').slice(0, 130);
        const date = new Date(it.querySelector('pubDate')?.textContent || Date.now());
        items.push({ title, desc, source: feed.source, time: timeAgo(date), cat: feed.cat, tag: /cai|queda|recua/i.test(title) ? 'dn' : /sobe|alta|avança/i.test(title) ? 'up' : 'nt', realTime: date.getTime() });
      });
    }
  } catch {
    // fallback below
  }

  S.news = items.length ? items.sort((a, b) => b.realTime - a.realTime) : FALLBACK_NEWS.map((n) => ({ ...n, realTime: Date.now() }));
  setApiStatus('rss', items.length ? 'ok' : 'err');
  renderDashNewsMini();
  renderNewsSection();
  renderAppNewsPage();
  return items.length > 0;
}

function updateCurrencyUI() {
  if (!S.usd) return;
  const chg = `${S.usd.pct >= 0 ? '▲' : '▼'} ${Math.abs(S.usd.pct).toFixed(2)}%`;
  const cls = S.usd.pct >= 0 ? 'up' : 'dn';

  if (el('tb-usd')) el('tb-usd').textContent = `R$${fmt(S.usd.bid, 3)}`;
  if (el('tb-usd-chg')) { el('tb-usd-chg').textContent = chg; el('tb-usd-chg').className = cls; }
  if (el('sb-usd')) el('sb-usd').textContent = `R$${fmt(S.usd.bid)}`;
  if (el('sb-usd-chg')) { el('sb-usd-chg').textContent = `${S.usd.pct >= 0 ? '+' : ''}${S.usd.pct.toFixed(2)}%`; el('sb-usd-chg').className = `sb-mkt-chg ${cls}`; }
  if (el('kpi-usd')) el('kpi-usd').textContent = `R$${fmt(S.usd.bid, 3)}`;
  if (el('kpi-usd-chg')) { el('kpi-usd-chg').textContent = `${chg} hoje`; el('kpi-usd-chg').className = `kpi-dlt ${cls}`; }
  if (el('b3-usd')) el('b3-usd').textContent = `R$${fmt(S.usd.bid, 3)}`;
  if (el('b3-usd-chg')) { el('b3-usd-chg').textContent = `${chg} hoje`; el('b3-usd-chg').className = `kpi-dlt ${cls}`; }
  if (el('hero-usd')) el('hero-usd').innerHTML = `R$${fmt(S.usd.bid, 3)} <span id="hero-usd-chg" class="${cls}">${chg}</span>`;

  if (S.eur) {
    if (el('b3-eur')) el('b3-eur').textContent = `R$${fmt(S.eur.bid, 3)}`;
    if (el('b3-eur-chg')) el('b3-eur-chg').textContent = `${S.eur.pct >= 0 ? '▲' : '▼'} ${Math.abs(S.eur.pct).toFixed(2)}% hoje`;
  }
}

function updateMacroUI() {
  if (!S.cdi) return;
  const cdi = `${S.cdi.toFixed(2).replace('.', ',')}% a.a.`;
  ['tb-cdi', 'sb-cdi', 'hero-cdi'].forEach((id) => { if (el(id)) el(id).textContent = cdi; });
  if (el('b3-cdi')) el('b3-cdi').textContent = `${S.cdi.toFixed(2).replace('.', ',')} %`;
  if (el('b3-selic')) el('b3-selic').textContent = `▲ Selic: ${S.selic.toFixed(2).replace('.', ',')} %`;
  if (el('kpi-cdi-delta')) el('kpi-cdi-delta').textContent = `▲ vs CDI +${(18.4 - S.cdi).toFixed(1)}% de alpha`;
  updateIbovUI();
}

function updateIbovUI() {
  if (!S.ibov) return;
  const p = Math.round(S.ibov.price).toLocaleString('pt-BR');
  const c = `${S.ibov.variation >= 0 ? '▲ +' : '▼ '}${Math.abs(S.ibov.variation).toFixed(2)}%`;
  const cls = S.ibov.variation >= 0 ? 'up' : 'dn';

  if (el('tb-ibov')) el('tb-ibov').textContent = p;
  if (el('tb-ibov-chg')) { el('tb-ibov-chg').textContent = c; el('tb-ibov-chg').className = cls; }
  if (el('sb-ibov')) el('sb-ibov').textContent = p;
  if (el('sb-ibov-chg')) { el('sb-ibov-chg').textContent = `${S.ibov.variation >= 0 ? '+' : ''}${S.ibov.variation.toFixed(2)}%`; el('sb-ibov-chg').className = `sb-mkt-chg ${cls}`; }
  if (el('kpi-ibov')) el('kpi-ibov').textContent = p;
  if (el('kpi-ibov-chg')) { el('kpi-ibov-chg').textContent = `${c} hoje`; el('kpi-ibov-chg').className = `kpi-dlt ${cls}`; }
  if (el('b3-ibov')) el('b3-ibov').textContent = p;
  if (el('b3-ibov-chg')) { el('b3-ibov-chg').textContent = `${c} hoje`; el('b3-ibov-chg').className = `kpi-dlt ${cls}`; }
  if (el('hero-ibov')) el('hero-ibov').innerHTML = `${p} <span id="hero-ibov-chg" class="${cls}">(${S.ibov.variation >= 0 ? '+' : ''}${S.ibov.variation.toFixed(2)}%)</span>`;

  if (!S.ibovHistory.length) {
    let base = S.ibov.price * (1 - S.ibov.variation / 100);
    for (let i = 0; i < 80; i += 1) { base += (Math.random() - 0.48) * (S.ibov.price * 0.001); S.ibovHistory.push(Math.round(base)); }
  }
  S.ibovHistory.push(Math.round(S.ibov.price));
  if (S.ibovHistory.length > 120) S.ibovHistory.shift();

  if (el('data-tag')) el('data-tag').textContent = 'DADOS REAIS';
  if (el('last-upd')) el('last-upd').textContent = `Atualizado: ${new Date().toLocaleTimeString('pt-BR')}`;
}

function updateHeroMarket() {
  if (!el('hero-market') || !S.stocks.length) return;
  el('hero-market').innerHTML = S.stocks.slice(0, 5).map((s) => `
    <div class="market-row">
      <span class="market-ticker">${s.ticker}</span>
      <span class="market-name" style="flex:1;margin:0 10px;font-size:11px;color:var(--text3)">${(s.name || s.ticker).slice(0, 18)}</span>
      <span class="market-price" style="font-family:var(--font-mono);font-size:12px;margin-right:8px">R$${fmt(s.price)}</span>
      <span class="market-chg ${(s.chg || 0) >= 0 ? 'up' : 'dn'}" style="font-family:var(--font-mono);font-size:11px">${(s.chg || 0) >= 0 ? '▲' : '▼'}${Math.abs(s.chg || 0).toFixed(2)}%</span>
    </div>
  `).join('');
}

function renderTickers() {
  const all = [...S.stocks, ...S.fiis];
  if (!all.length) return;
  const html = all.map((s) => `<div class="ticker-item"><span class="t-name">${s.ticker}</span><span class="t-price">R$${fmt(s.price)}</span><span class="t-chg ${(s.chg || 0) >= 0 ? 'up' : 'dn'}">${(s.chg || 0) >= 0 ? '▲' : '▼'}${Math.abs(s.chg || 0).toFixed(2)}%</span></div>`).join('');
  if (el('ticker-track-pub')) el('ticker-track-pub').innerHTML = html + html;
  if (el('app-ticker')) el('app-ticker').innerHTML = html.replace(/ticker-item/g, 'dt-item').replace(/t-name/g, 'dt-name').replace(/t-price/g, 'dt-price').replace(/t-chg/g, 'dt-chg');
}

function renderDashTx() {
  if (!el('dash-tx')) return;
  el('dash-tx').innerHTML = TXS.map((t) => `
    <div class="t-row" style="grid-template-columns:2fr 1fr 1fr 90px">
      <div><div class="t-name">${t.name}</div><div class="t-sub">${t.co}</div></div>
      <div style="font-family:var(--font-mono);font-size:12px">${t.val}</div>
      <div style="font-family:var(--font-mono);font-size:11px;color:var(--text3)">${t.date}</div>
      <div><span class="badge ${t.type}">${t.type === 'buy' ? 'COMPRA' : t.type === 'sell' ? 'VENDA' : 'PEND.'}</span></div>
    </div>`).join('');
}

function renderAllTx() {
  if (!el('all-tx')) return;
  el('all-tx').innerHTML = TXS.map((t) => `
    <div class="t-row" style="grid-template-columns:2fr 1fr 1.2fr 1fr 90px">
      <div><div class="t-name">${t.name}</div><div class="t-sub">${t.co}</div></div>
      <div style="font-family:var(--font-mono);font-size:12px">${t.val}</div>
      <div style="font-family:var(--font-mono);font-size:11px">${t.chg}</div>
      <div style="font-family:var(--font-mono);font-size:11px;color:var(--text3)">${t.date}</div>
      <div><span class="badge ${t.type}">${t.type === 'buy' ? 'COMPRA' : t.type === 'sell' ? 'VENDA' : 'PEND.'}</span></div>
    </div>`).join('');
}

function renderPortfolio() {
  if (!el('portfolio-grid')) return;
  el('portfolio-grid').innerHTML = PORTFOLIO_ASSETS.map((a) => `
    <div class="port-card">
      <div class="port-ticker">${a.ticker}</div>
      <div class="port-name">${a.name}</div>
      <div class="port-type">${a.type}</div>
      <div class="port-val">${a.val}</div>
      <div class="kpi-dlt ${a.chg >= 0 ? 'up' : 'dn'}">${a.chg >= 0 ? '▲' : '▼'} ${Math.abs(a.chg).toFixed(1)}% no mês</div>
      <div class="port-bar"><div class="port-bar-fill" style="width:${Math.min(a.pct * 7, 100)}%;background:${a.c}"></div></div>
    </div>`).join('');
}

function renderCompanies() {
  if (!el('companies-grid')) return;
  el('companies-grid').innerHTML = COMPANIES.map((c) => `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:22px">
      <div style="width:44px;height:44px;border-radius:10px;background:${c.c};display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:800;font-size:14px;color:#fff;margin-bottom:14px">${c.i}</div>
      <div style="font-size:14px;font-weight:600;margin-bottom:2px">${c.n}</div>
      <div style="font-size:11px;color:var(--text2);margin-bottom:14px">${c.s}</div>
      <div style="display:flex;gap:20px"><div><div style="font-family:var(--font-display);font-weight:700;font-size:16px;color:var(--gold)">${c.aum}</div><div style="font-family:var(--font-mono);font-size:10px;color:var(--text3)">AUM</div></div><div><div style="font-family:var(--font-display);font-weight:700;font-size:16px">${c.ativos}</div><div style="font-family:var(--font-mono);font-size:10px;color:var(--text3)">ATIVOS</div></div></div>
    </div>`).join('');
}

function renderDashNewsMini() {
  if (!el('dash-news-mini') || !S.news.length) return;
  el('dash-news-mini').innerHTML = S.news.slice(0, 4).map((n) => `
    <div class="app-news-item">
      <div class="app-news-src">${n.source}</div>
      <div class="app-news-title">${n.title} <span class="app-news-tag ${n.tag}">${n.tag === 'up' ? 'ALTA' : n.tag === 'dn' ? 'BAIXA' : 'NEUTRO'}</span></div>
      <div class="app-news-time">${n.time}</div>
    </div>`).join('');
}

function renderAppNewsPage() {
  if (!el('app-news-full') || !S.news.length) return;
  el('app-news-full').innerHTML = S.news.map((n) => `
    <div class="app-news-item"><div class="app-news-src">${n.source}</div><div class="app-news-title">${n.title}</div><div style="font-size:12px;color:var(--text2)">${n.desc || ''}</div><div class="app-news-time">${n.time}</div></div>
  `).join('');
}

function renderNewsSection() {
  if (!S.news.length) return;
  const featured = S.news[0];
  if (el('nf-cat')) el('nf-cat').textContent = featured.cat || 'Mercado';
  if (el('nf-title')) el('nf-title').textContent = featured.title;
  if (el('nf-desc')) el('nf-desc').textContent = featured.desc || '';
  if (el('nf-src')) el('nf-src').textContent = featured.source;
  if (el('nf-time')) el('nf-time').textContent = featured.time;
  if (el('news-list-pub')) el('news-list-pub').innerHTML = S.news.slice(1, 7).map((n, i) => `<div class="news-list-item"><div class="news-list-num">0${i + 2}</div><div><div class="news-api-source">${n.source}</div><div class="news-list-title">${n.title}</div><div class="news-list-meta">${n.cat} · ${n.time}</div></div></div>`).join('');
}

function drawSimpleLine(canvasId, data, color) {
  const c = el(canvasId);
  if (!c || !data.length) return;
  const ctx = c.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const W = c.offsetWidth || c.width;
  const H = Number(c.getAttribute('height')) || 160;
  c.width = W * dpr;
  c.height = H * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);

  const min = Math.min(...data);
  const max = Math.max(...data);
  const toX = (i) => (i / (data.length - 1)) * (W - 30) + 15;
  const toY = (v) => H - 20 - ((v - min) / ((max - min) || 1)) * (H - 35);

  ctx.strokeStyle = 'rgba(255,255,255,.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i += 1) {
    const y = 15 + (i * (H - 30)) / 3;
    ctx.beginPath();
    ctx.moveTo(10, y);
    ctx.lineTo(W - 10, y);
    ctx.stroke();
  }

  ctx.beginPath();
  data.forEach((v, i) => {
    if (i === 0) ctx.moveTo(toX(i), toY(v));
    else ctx.lineTo(toX(i), toY(v));
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawPerfChart() {
  drawSimpleLine('chart-perf', [0, 1.1, 1.6, 2.5, 2.1, 3.2, 4.1, 5.0, 5.8, 6.6, 7.2, 8.4, 9.1, 10.4, 11.2, 12.4, 13.6, 14.8, 16.3, 18.4], '#c9a84c');
}
function drawDonutChart() {
  const c = el('chart-donut');
  if (!c) return;
  const ctx = c.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  c.width = 140 * dpr;
  c.height = 140 * dpr;
  ctx.scale(dpr, dpr);
  const data = [35, 25, 22, 18];
  const colors = ['#c9a84c', '#4a9eff', '#22c55e', 'rgba(255,255,255,.18)'];
  let s = -Math.PI / 2;
  data.forEach((v, i) => {
    const a = (v / 100) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(70, 70);
    ctx.arc(70, 70, 52, s, s + a);
    ctx.closePath();
    ctx.fillStyle = colors[i];
    ctx.fill();
    s += a;
  });
  ctx.beginPath();
  ctx.arc(70, 70, 36, 0, Math.PI * 2);
  ctx.fillStyle = '#12141e';
  ctx.fill();
  ctx.fillStyle = '#e2e8f0';
  ctx.textAlign = 'center';
  ctx.font = 'bold 12px Playfair Display';
  ctx.fillText('R$284M', 70, 74);
}
function drawIbovChart() { if (S.ibovHistory.length) drawSimpleLine('chart-ibov', S.ibovHistory.slice(-80), S.ibov?.variation >= 0 ? '#22c55e' : '#ef4444'); }
function drawBarChart() { drawSimpleLine('chart-bar', [2.1, 3.4, 1.8, 2.9, 4.2, 3.1], '#c9a84c'); }
function drawVarChart() { drawSimpleLine('chart-var', Array.from({ length: 24 }, () => (Math.random() - 0.5) * 8), '#4a9eff'); }
function drawSentimentChart() { drawSimpleLine('chart-sentiment', [58, 62, 70, 64, 67], '#22c55e'); }

function showToast(title, msg, border = 'var(--gold)') {
  const toast = el('toast');
  if (!toast) return;
  toast.style.borderLeftColor = border;
  if (el('toast-title')) el('toast-title').textContent = title;
  if (el('toast-msg')) el('toast-msg').textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 5000);
}

function renderSettingsAPIs() {
  if (!el('settings-api-status')) return;
  const rows = [
    ['Brapi.dev', 'Ações e FIIs (B3)', S.apis.brapi],
    ['HG Brasil Finance', 'CDI, Selic, IBOVESPA', S.apis.hg],
    ['AwesomeAPI', 'USD/BRL, EUR/BRL', S.apis.awesome],
    ['RSS / Notícias', 'InfoMoney, Suno Research', S.apis.rss]
  ];
  el('settings-api-status').innerHTML = rows.map((r) => `<div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--border)"><div><div style="font-size:13px;font-weight:600">${r[0]}</div><div style="font-size:11px;color:var(--text3);font-family:var(--font-mono)">${r[1]}</div></div><div style="font-family:var(--font-mono);font-size:11px;color:${r[2] === 'ok' ? 'var(--green)' : r[2] === 'err' ? 'var(--red)' : 'var(--gold)'}">${r[2] === 'ok' ? 'Online' : r[2] === 'err' ? 'Indisponível' : 'Verificando'}</div></div>`).join('');
}

function initLiveFeed() {
  if (!el('live-feed')) return;
  el('live-feed').innerHTML = [
    'Nova ordem de compra +R$ 1,2M em CRI Multiplan aprovada',
    'BTG Pactual renovou contrato de custódia por 24 meses',
    'Alerta: CPFL debênture abaixo de 97,2% do par',
    'Cupom recebido: R$ 148K — FII HGLG11'
  ].map((txt, i) => `<div class="feed-item"><div class="feed-icon" style="background:rgba(201,168,76,.12)">${['📈', '🏢', '⚠️', '💰'][i]}</div><div class="feed-txt">${txt}<div class="feed-time">há ${i + 1} min</div></div></div>`).join('');
}

function addFeedItem() {
  if (!el('live-feed')) return;
  const txt = S.usd ? `USD/BRL: R$${fmt(S.usd.bid, 3)} (${S.usd.pct.toFixed(2)}%)` : 'Mercado em atualização';
  const node = document.createElement('div');
  node.className = 'feed-item';
  node.innerHTML = `<div class="feed-icon" style="background:rgba(74,158,255,.12)">💱</div><div class="feed-txt">${txt}<div class="feed-time">agora</div></div>`;
  el('live-feed').prepend(node);
  while (el('live-feed').children.length > 5) el('live-feed').lastChild.remove();
}

function simulatePrices() {
  S.stocks.forEach((s) => { s.price += s.price * (Math.random() - 0.502) * 0.0008; s.chg += (Math.random() - 0.5) * 0.05; });
  S.fiis.forEach((f) => { f.price += f.price * (Math.random() - 0.502) * 0.0005; f.chg += (Math.random() - 0.5) * 0.04; });
  if (S.ibovHistory.length) {
    const last = S.ibovHistory[S.ibovHistory.length - 1] + (Math.random() - 0.48) * 100;
    S.ibovHistory.push(Math.round(last));
    if (S.ibovHistory.length > 130) S.ibovHistory.shift();
    if (S.ibov) S.ibov.price = last;
  }
  renderTickers();
  updateHeroMarket();
  drawIbovChart();
}

function scrollTo_(id) { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); }
function goHome() { document.querySelectorAll('.view').forEach((v) => v.classList.remove('active')); el('site-view')?.classList.add('active'); }
function showLogin() { document.querySelectorAll('.view').forEach((v) => v.classList.remove('active')); el('login-view-wrap')?.classList.add('active'); preCheckAPIs(); }

async function doLogin() {
  const email = el('inp-email')?.value?.trim();
  const pass = el('inp-pass')?.value;
  const user = USERS.find((u) => u.email === email && u.pass === pass);
  if (!user) { el('login-err')?.classList.add('show'); return; }
  document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
  el('app-view')?.classList.add('active');
  await initApp(user);
}

function doLogout() { goHome(); }

function showAppPage(id, node) {
  document.querySelectorAll('.app-page').forEach((p) => p.classList.remove('active'));
  el(`page-${id}`)?.classList.add('active');
  document.querySelectorAll('.sb-item').forEach((i) => i.classList.remove('active'));
  if (node) node.classList.add('active');
  const titles = { dashboard: 'Dashboard', portfolio: 'Portfolio', transactions: 'Transações', b3: 'B3 ao Vivo', appnews: 'Notícias do Mercado', reports: 'Relatórios', companies: 'Empresas', settings: 'Configurações' };
  if (el('app-page-title')) el('app-page-title').textContent = titles[id] || id;
  if (id === 'b3') setTimeout(drawIbovChart, 50);
  if (id === 'reports') setTimeout(() => { drawBarChart(); drawVarChart(); }, 50);
  if (id === 'settings') renderSettingsAPIs();
}

function submitForm() { showToast('SOLICITAÇÃO ENVIADA', 'Entraremos em contato em até 24 horas úteis. Obrigado!'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function chipSelect() {}
function filterNews() {}

async function preCheckAPIs() {
  fetchAwesome().then((ok) => { if (el('apill-awesome')) el('apill-awesome').className = `api-pill ${ok ? 'ok' : 'err'}`; });
  fetchHG().then((ok) => { if (el('apill-hg')) el('apill-hg').className = `api-pill ${ok ? 'ok' : 'err'}`; });
  fetch('https://brapi.dev/api/quote/PETR4', { signal: AbortSignal.timeout(6000) })
    .then((r) => { if (el('apill-brapi')) el('apill-brapi').className = `api-pill ${r.ok ? 'ok' : 'err'}`; })
    .catch(() => { if (el('apill-brapi')) el('apill-brapi').className = 'api-pill err'; });
  fetch('https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=IBM&apikey=demo', { signal: AbortSignal.timeout(6000) })
    .then((r) => { if (el('apill-alpha')) el('apill-alpha').className = `api-pill ${r.ok ? 'ok' : 'err'}`; })
    .catch(() => { if (el('apill-alpha')) el('apill-alpha').className = 'api-pill err'; });
  fetchNews().then((ok) => { if (el('apill-rss')) el('apill-rss').className = `api-pill ${ok ? 'ok' : 'err'}`; });
}

async function initApp(user) {
  if (el('sb-name')) el('sb-name').textContent = user.name;
  if (el('sb-role')) el('sb-role').textContent = user.role;
  if (el('sb-avatar')) el('sb-avatar').textContent = user.name.split(' ').map((w) => w[0]).slice(0, 2).join('');

  renderDashTx();
  renderAllTx();
  renderPortfolio();
  renderCompanies();
  initLiveFeed();
  drawPerfChart();
  drawDonutChart();

  showToast('CONECTANDO APIs', 'Buscando dados reais da B3, câmbio e notícias...');
  const results = await Promise.allSettled([fetchAwesome(), fetchHG(), fetchBrapi(), fetchNews()]);
  const ok = results.filter((r) => r.status === 'fulfilled' && r.value === true).length;

  if (el('data-tag')) el('data-tag').textContent = ok > 0 ? 'DADOS REAIS' : 'SIMULADO';
  showToast(ok > 0 ? 'CONECTADO' : 'MODO SIMULADO', ok > 0 ? `${ok}/4 APIs ativas — dados carregados!` : 'APIs indisponíveis. Dados simulados em uso.', ok > 0 ? 'var(--green)' : '#ef4444');

  drawSentimentChart();
  drawIbovChart();
  drawBarChart();
  drawVarChart();

  setInterval(simulatePrices, 2500);
  setInterval(addFeedItem, 5500);
  setInterval(async () => {
    await Promise.allSettled([fetchAwesome(), fetchHG()]);
    drawPerfChart();
    if (el('last-upd')) el('last-upd').textContent = `Atualizado: ${new Date().toLocaleTimeString('pt-BR')}`;
  }, 60000);
  setInterval(fetchNews, 300000);
}

function bindGlobalUI() {
  const passInput = el('inp-pass');
  if (passInput) {
    passInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });
  }

  window.addEventListener('scroll', () => {
    const nav = el('pub-nav');
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
  });

  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach((node) => revealObs.observe(node));

  setInterval(() => { if (el('app-clock')) el('app-clock').textContent = new Date().toLocaleTimeString('pt-BR'); }, 1000);
}

async function initPublic() {
  await Promise.allSettled([fetchAwesome(), fetchHG(), fetchBrapi(), fetchNews()]);
  renderNewsSection();
}

function exposeGlobals() {
  Object.assign(window, {
    scrollTo_, showLogin, goHome, doLogin, doLogout, showAppPage, chipSelect, filterNews, submitForm
  });
}

export async function initLogic() {
  exposeGlobals();
  bindGlobalUI();
  await initPublic();
}
