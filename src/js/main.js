import { SiteView } from '../components/views/site-view.js';
import { LoginView } from '../components/views/login-view.js';
import { AppView } from '../components/views/app-view.js';
import { SharedOverlays } from '../components/shared/overlays.js';
import { initLogic } from './modules/app-logic.js';

function mount() {
  const app = document.getElementById('app');
  app.innerHTML = `${SiteView()}${LoginView()}${AppView()}${SharedOverlays()}`;
}

mount();
initLogic();
