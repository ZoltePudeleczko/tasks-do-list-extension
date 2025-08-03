import React, { useState } from 'react';
import { useTranslation, SUPPORTED_LANGUAGES, SupportedLanguage } from '../i18n/TranslationContext';

interface LanguageSelectorProps {
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ className = '' }) => {
  const { currentLanguage, setLanguage, getSupportedLanguages, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const supportedLanguages = getSupportedLanguages();

  const handleLanguageChange = (language: SupportedLanguage) => {
    setLanguage(language);
    setIsOpen(false);
  };

  const getCurrentLanguageName = () => {
    return supportedLanguages[currentLanguage] || 'English';
  };

  return (
    <div className={`language-selector ${className}`}>
      <button
        className="language-selector-btn"
        onClick={() => setIsOpen(!isOpen)}
        title={t('common.selectLanguage')}
      >
        <span className="language-selector-current">
          {getCurrentLanguageName()}
        </span>
        <span className="language-selector-arrow">
          {isOpen ? '▲' : '▼'}
        </span>
      </button>
      
      {isOpen && (
        <div className="language-selector-dropdown">
          {Object.entries(supportedLanguages).map(([code, name]) => (
            <button
              key={code}
              className={`language-selector-option ${currentLanguage === code ? 'selected' : ''}`}
              onClick={() => handleLanguageChange(code as SupportedLanguage)}
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}; 