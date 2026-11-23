"use strict";

const languageMenu = document.getElementById("page-language");
const languageSelector = document.getElementById("language-selector");
const languageStatus = document.getElementById("language-status");
let translationRequested = false;

languageMenu.addEventListener("toggle", () => {
  if (!languageMenu.open || translationRequested) return;
  translationRequested = true;
  languageStatus.textContent = "Cargando idiomas… / Loading languages…";
  const script = document.createElement("script");
  const observer = new MutationObserver(() => {
    const select = languageSelector.querySelector("select");
    if (!select || select.options.length < 2) return;
    observer.disconnect();
    clearTimeout(timeout);
    select.setAttribute("aria-label", "Idioma / Language");
    languageStatus.textContent = "";
  });

  function showFallback() {
    observer.disconnect();
    clearTimeout(timeout);
    script.remove();
    delete window.initEDUCRBTranslation;
    languageSelector.replaceChildren();
    languageStatus.textContent = "Usa el enlace para traducir la página. / Use the link to translate the page.";
    translationRequested = false;
  }

  const timeout = setTimeout(showFallback, 12000);
  observer.observe(languageSelector, {childList: true, subtree: true});
  window.initEDUCRBTranslation = () => {
    delete window.initEDUCRBTranslation;
    try {
      new window.google.translate.TranslateElement({pageLanguage: "es"}, languageSelector.id);
    } catch {
      showFallback();
    }
  };
  script.src = "https://translate.google.com/translate_a/element.js?cb=initEDUCRBTranslation";
  script.addEventListener("error", showFallback, {once: true});
  document.head.append(script);
});
