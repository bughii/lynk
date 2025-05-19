import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enLang from "./locales/en/en.json";
import itLang from "./locales/it/it.json";

const resources = {
  en: {
    translation: enLang,
  },
  it: {
    translation: itLang,
  },
};

i18n.use(initReactI18next).init({
  resources,
  fallbackLng: "en",
  lng: "en",

  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
