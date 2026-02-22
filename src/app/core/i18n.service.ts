import { Injectable, signal } from '@angular/core';

type Lang = 'pt' | 'en';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly storeKey = 'finvest_lang';
  readonly lang = signal<Lang>((localStorage.getItem(this.storeKey) as Lang) || 'pt');

  private readonly dict: Record<Lang, Record<string, string>> = {
    pt: {
      brand: 'FinVest Capital',
      nav_home: 'Início',
      nav_services: 'Serviços',
      nav_products: 'Produtos',
      nav_market: 'Mercado',
      nav_contact: 'Contato',
      nav_portal: 'Acessar Portal',
      hero_kicker: 'Gestão de Investimentos B2B',
      hero_title: 'Capital que trabalha com inteligência.',
      hero_desc: 'Plataforma institucional com dados de mercado, portfolio e relatórios executivos para empresas.',
      hero_cta: 'Acessar Plataforma',
      services_title: 'Soluções institucionais',
      services_1: 'Gestão de Portfolio',
      services_2: 'Análise de Mercado',
      services_3: 'Estruturação de CRI/CRA',
      login_title: 'Portal Institucional',
      login_sub: 'Acesso exclusivo para clientes institucionais.',
      login_email: 'E-mail institucional',
      login_pass: 'Senha',
      login_btn: 'Entrar',
      login_back: 'Voltar ao site',
      platform_title: 'Dashboard Institucional',
      logout: 'Sair',
      news_title: 'Notícias do mercado',
      language: 'EN'
    },
    en: {
      brand: 'FinVest Capital',
      nav_home: 'Home',
      nav_services: 'Services',
      nav_products: 'Products',
      nav_market: 'Market',
      nav_contact: 'Contact',
      nav_portal: 'Access Portal',
      hero_kicker: 'B2B Investment Management',
      hero_title: 'Capital that works with intelligence.',
      hero_desc: 'Institutional platform with market data, portfolio tracking, and executive reporting for companies.',
      hero_cta: 'Access Platform',
      services_title: 'Institutional solutions',
      services_1: 'Portfolio Management',
      services_2: 'Market Intelligence',
      services_3: 'CRI/CRA Structuring',
      login_title: 'Institutional Portal',
      login_sub: 'Exclusive access for institutional clients.',
      login_email: 'Corporate email',
      login_pass: 'Password',
      login_btn: 'Sign in',
      login_back: 'Back to website',
      platform_title: 'Institutional Dashboard',
      logout: 'Sign out',
      news_title: 'Market news',
      language: 'PT'
    }
  };

  t(key: string): string {
    return this.dict[this.lang()]?.[key] ?? key;
  }

  toggle(): void {
    const next: Lang = this.lang() === 'pt' ? 'en' : 'pt';
    this.lang.set(next);
    localStorage.setItem(this.storeKey, next);
    document.documentElement.lang = next === 'pt' ? 'pt-BR' : 'en';
  }
}
