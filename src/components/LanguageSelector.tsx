import React, { useState, useEffect, useRef } from 'react';
import { useTranslation, SUPPORTED_LANGUAGES, SupportedLanguage } from '../i18n/TranslationContext';

interface LanguageSelectorProps {
  className?: string;
  onOpen?: () => void;
  open?: boolean;
  onToggle?: (open: boolean) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  className = '', 
  onOpen, 
  open: externalOpen, 
  onToggle 
}) => {
  const { currentLanguage, setLanguage, getSupportedLanguages, t } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(false);
  const languageSelectorRef = useRef<HTMLDivElement>(null);
  
  // Use external state if provided, otherwise use internal state
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = (value: boolean) => {
    if (onToggle) {
      onToggle(value);
    } else {
      setInternalOpen(value);
    }
  };

  const supportedLanguages = getSupportedLanguages();

  const handleLanguageChange = (language: SupportedLanguage) => {
    setLanguage(language);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && languageSelectorRef.current && !languageSelectorRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getCurrentLanguageName = () => {
    return supportedLanguages[currentLanguage] || 'English';
  };

  return (
    <div className={`language-selector ${className}`} ref={languageSelectorRef}>
      <button
        className="language-selector-btn"
        onClick={() => {
          if (onToggle) {
            onToggle(!isOpen);
          } else if (onOpen) {
            onOpen();
          } else {
            setIsOpen(!isOpen);
          }
        }}
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