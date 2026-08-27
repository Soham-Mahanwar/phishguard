import React, { createContext, useContext, useState, useEffect } from 'react';

import { translations } from './translations';

export type Language = 'en' | 'hi' | 'bn' | 'mr' | 'te' | 'ta' | 'gu' | 'ur' | 'kn' | 'or' | 'ml' | 'pa' | 'as' | 'mai' | 'sat' | 'ks' | 'ne' | 'sd' | 'kok' | 'doi' | 'mni';

interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  greeting: string;
}

export const languageOptions: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', greeting: 'Welcome' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', greeting: 'नमस्ते' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', greeting: 'স্বাগতম' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', greeting: 'स्वागत आहे' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', greeting: 'స్వాగతం' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', greeting: 'வரவேற்பு' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', greeting: 'સ્વાગત' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', greeting: 'خوش آمدید' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', greeting: 'ಸ್ವಾಗತ' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', greeting: 'ସ୍ୱାଗତ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', greeting: 'സ്വാഗതം' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', greeting: 'ਜੀ ਆਇਆਂ ਨੂੰ' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', greeting: 'স্বাগতম' },
  { code: 'mai', name: 'Maithili', nativeName: 'मैथिली', greeting: 'स्वागत अछि' },
  { code: 'sat', name: 'Santali', nativeName: 'संताली', greeting: 'सगुन दाराम' },
  { code: 'ks', name: 'Kashmiri', nativeName: 'کٲشور', greeting: 'خوش آمدید' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', greeting: 'स्वागत छ' },
  { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي', greeting: 'ڀلي ڪري آਇਆ' },
  { code: 'kok', name: 'Konkani', nativeName: 'कोंकणी', greeting: 'येवकार' },
  { code: 'doi', name: 'Dogri', nativeName: 'डोगरी', greeting: 'स्वागत ऐ' },
  { code: 'mni', name: 'Manipuri', nativeName: 'মৈতৈলোন', greeting: 'তরাম্না ওকচরি' },
];

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('kisanSetuLanguage');
    return (saved as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('kisanSetuLanguage', lang);
  };

  const t = (key: string) => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
