# FinVest - Documentation (English / Portuguese)

## EN

### Project Overview
This repository contains the FinVest website and platform UI in Angular.

Current status:
- The project is running with Angular routing and components.
- `src/index.html` is now standard Angular bootstrap (no monolithic inline app anymore).
- The Home page was updated to match the requested visual layout section by section.
- Global visual style from the original layout was moved to `src/styles.scss`.

### Requirements
- Node.js 20+ (recommended)
- npm 10+ (recommended)
- Angular CLI (`ng`) available via global install or `npx`

### Install
```bash
npm install
```

### Run (development)
```bash
ng serve
```
Open:
- `http://localhost:4200/`

### Build (production)
```bash
ng build
```
Output folder:
- `dist/finvest`

### Main Structure
- `src/index.html`: Angular host document
- `src/styles.scss`: global FinVest design system and section styles
- `src/app/app.routes.ts`: route definitions
- `src/app/components/home/...`: home sections (navbar, hero, services, numbers, about, products, news, team, contact, footer)
- `src/app/components/login/...`: login view
- `src/app/components/platform/...`: platform dashboard
- `src/app/core/market.service.ts`: market/news data layer with API + fallback

### Notes
- Home is already aligned to the requested layout style.
- Login and Platform can be further tuned for strict 1:1 parity if needed.
- A CSS budget warning may appear for `platform.component.scss`; build still succeeds.

---

## PT-BR

### Visão Geral do Projeto
Este repositório contém o site e a interface da plataforma FinVest em Angular.

Status atual:
- O projeto está rodando com rotas e componentes Angular.
- O `src/index.html` voltou para o bootstrap padrão do Angular (sem app monolítico inline).
- A Home foi atualizada para o layout solicitado, seção por seção.
- O estilo visual global do layout original foi movido para `src/styles.scss`.

### Requisitos
- Node.js 20+ (recomendado)
- npm 10+ (recomendado)
- Angular CLI (`ng`) disponível via instalação global ou `npx`

### Instalação
```bash
npm install
```

### Executar (desenvolvimento)
```bash
ng serve
```
Acesse:
- `http://localhost:4200/`

### Build (produção)
```bash
ng build
```
Pasta de saída:
- `dist/finvest`

### Estrutura Principal
- `src/index.html`: documento host do Angular
- `src/styles.scss`: design system FinVest e estilos globais das seções
- `src/app/app.routes.ts`: definição de rotas
- `src/app/components/home/...`: seções da home (navbar, hero, services, numbers, about, products, news, team, contact, footer)
- `src/app/components/login/...`: tela de login
- `src/app/components/platform/...`: dashboard da plataforma
- `src/app/core/market.service.ts`: camada de dados de mercado/notícias com API + fallback


# FinVest
