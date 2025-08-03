import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Import translation files
import enTranslations from './translations/en.json';
import esTranslations from './translations/es.json';
import plTranslations from './translations/pl.json';

// Define available languages
export const SUPPORTED_LANGUAGES = {
  en: 'English',
  es: 'Español',
  pl: 'Polski'
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

// Translation data type
type TranslationData = typeof enTranslations;

// Context type
interface TranslationContextType {
  currentLanguage: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  getSupportedLanguages: () => typeof SUPPORTED_LANGUAGES;
}

// Create context
const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

// Translation data mapping
const translations: Record<SupportedLanguage, TranslationData> = {
  en: enTranslations,
  es: esTranslations,
  pl: plTranslations
};

// Helper function to get nested translation value
const getNestedValue = (obj: any, path: string): string | undefined => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
};

// Helper function to interpolate parameters
const interpolateParams = (text: string, params?: Record<string, string | number>): string => {
  if (!params) return text;
  
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key] !== undefined ? String(params[key]) : match;
  });
};

// Provider component
interface TranslationProviderProps {
  children: ReactNode;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');

  // Load language from storage on mount
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const stored = await chrome.storage.sync.get('language') as { language?: SupportedLanguage };
        if (stored.language && SUPPORTED_LANGUAGES[stored.language]) {
          setCurrentLanguage(stored.language);
        } else {
          // Auto-detect language from browser
          const browserLanguage = navigator.language.split('-')[0];
          const detectedLanguage = Object.keys(SUPPORTED_LANGUAGES).includes(browserLanguage) 
            ? browserLanguage as SupportedLanguage 
            : 'en';
          setCurrentLanguage(detectedLanguage);
        }
      } catch (err) {
        console.error('Failed to load language setting:', err);
        setCurrentLanguage('en');
      }
    };

    loadLanguage();
  }, []);

  // Save language to storage when it changes
  useEffect(() => {
    const saveLanguage = async () => {
      try {
        await chrome.storage.sync.set({ language: currentLanguage });
      } catch (err) {
        console.error('Failed to save language setting:', err);
      }
    };

    saveLanguage();
  }, [currentLanguage]);

  // Translation function
  const t = (key: string, params?: Record<string, string | number>): string => {
    const translation = getNestedValue(translations[currentLanguage], key);
    
    if (translation === undefined) {
      // Fallback to English if translation not found
      const fallbackTranslation = getNestedValue(translations.en, key);
      if (fallbackTranslation === undefined) {
        console.warn(`Translation key not found: ${key}`);
        return key; // Return the key itself as fallback
      }
      return interpolateParams(fallbackTranslation, params);
    }
    
    return interpolateParams(translation, params);
  };

  // Set language function
  const setLanguage = (language: SupportedLanguage) => {
    setCurrentLanguage(language);
  };

  // Get supported languages
  const getSupportedLanguages = () => SUPPORTED_LANGUAGES;

  const value: TranslationContextType = {
    currentLanguage,
    setLanguage,
    t,
    getSupportedLanguages
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

// Hook to use translations
export const useTranslation = (): TranslationContextType => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}; 