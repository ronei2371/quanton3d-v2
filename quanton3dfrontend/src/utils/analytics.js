/**
 * analytics.js — Wrapper para eventos GA4 (p1-tech-4)
 * Measurement ID configurado via variável de ambiente VITE_GA4_ID no Render.
 *
 * Uso:
 *   import { trackEvent, GA_EVENTS } from '../utils/analytics';
 *   trackEvent(GA_EVENTS.CLICK_BUY_RESIN, { resin_name: 'Poseidon', resin_id: 'poseidon' });
 */

/** Dispara um evento GA4 de forma segura (não lança erro se gtag não estiver carregado). */
export function trackEvent(eventName, params = {}) {
  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params);
    }
  } catch (e) {
    // silencioso em produção
  }
}

/** Nomes canônicos dos eventos customizados da Quanton3D. */
export const GA_EVENTS = {
  /** Usuário abre/visualiza o perfil de parâmetros de uma resina ou impressora. */
  VIEW_PROFILE: 'view_profile',

  /** Usuário copia o perfil de parâmetros (botão copiar). */
  COPY_PROFILE: 'copy_profile',

  /** Usuário inicia o assistente de calibração. */
  START_CALIBRATION: 'start_calibration',

  /** Usuário clica em "Comprar" em uma resina do catálogo. */
  CLICK_BUY_RESIN: 'click_buy_resin',

  /** Usuário é redirecionado para finalizar compra na loja (equivalente a purchase intent). */
  PURCHASE_INTENT: 'purchase',
};

/**
 * Helpers de alto nível — chamadas prontas para usar nos componentes.
 */

export function trackViewProfile({ resin_name, printer_name }) {
  trackEvent(GA_EVENTS.VIEW_PROFILE, {
    resin_name: resin_name || undefined,
    printer_name: printer_name || undefined,
  });
}

export function trackCopyProfile({ resin_name, printer_name }) {
  trackEvent(GA_EVENTS.COPY_PROFILE, {
    resin_name: resin_name || undefined,
    printer_name: printer_name || undefined,
  });
}

export function trackStartCalibration({ resin_name }) {
  trackEvent(GA_EVENTS.START_CALIBRATION, {
    resin_name: resin_name || undefined,
  });
}

export function trackClickBuyResin({ resin_name, resin_id, value }) {
  trackEvent(GA_EVENTS.CLICK_BUY_RESIN, {
    resin_name,
    resin_id,
    currency: 'BRL',
    value: value || undefined,
  });
}

export function trackPurchaseIntent({ resin_name, resin_id, value }) {
  trackEvent(GA_EVENTS.PURCHASE_INTENT, {
    currency: 'BRL',
    value: value || undefined,
    items: [{ item_name: resin_name, item_id: resin_id }],
  });
}
