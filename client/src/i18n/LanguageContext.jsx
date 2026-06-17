import { createContext, useContext, useState, useCallback } from "react";
import fr from "./fr.json";
import en from "./en.json";
import ar from "./ar.json";

const translations = { fr, en, ar };

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem("flamingo-lang") || "fr";
  });

  const switchLang = useCallback((newLang) => {
    setLang(newLang);
    localStorage.setItem("flamingo-lang", newLang);
  }, []);

  const t = useCallback(
    (key) => {
      const keys = key.split(".");
      let value = translations[lang];
      for (const k of keys) {
        value = value?.[k];
      }
      return value || key;
    },
    [lang],
  );

  const localizedValue = useCallback(
    (obj) => {
      if (!obj) return "";
      if (typeof obj === "string") return obj;
      return obj[lang] || obj.fr || obj.en || "";
    },
    [lang],
  );

  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <LanguageContext.Provider
      value={{ lang, switchLang, t, localizedValue, dir }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
