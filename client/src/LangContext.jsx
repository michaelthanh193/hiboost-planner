import { createContext, useContext, useState } from 'react';
import { translations } from './lang';

const LangContext = createContext();

export function LangProvider({ children }) {
  const [lang, setLang] = useState('vi');
  const t = (key) => translations[lang]?.[key] ?? translations.en[key] ?? key;
  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
