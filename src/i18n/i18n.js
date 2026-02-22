import { translations } from "./translations.js";

const KEY = "finvest_lang";
let current = localStorage.getItem(KEY) || "pt-BR";

export function getLang() {
  return current;
}

export function toggleLang() {
  current = current === "pt-BR" ? "en-US" : "pt-BR";
  localStorage.setItem(KEY, current);
  document.documentElement.lang = current === "pt-BR" ? "pt-BR" : "en";
  return current;
}

export function t(path) {
  return translations[current]?.[path] || path;
}

export function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.getAttribute("data-i18n");
    node.textContent = t(key);
  });

  const toggle = document.getElementById("lang-toggle");
  if (toggle) {
    toggle.textContent = t("nav.langShort");
    toggle.title = t("nav.lang");
  }
}
