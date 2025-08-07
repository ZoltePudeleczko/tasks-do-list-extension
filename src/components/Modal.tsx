import React, { useEffect, useRef } from 'react';
import { useTranslation } from '../i18n/TranslationContext';
import './Modal.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  placeholder = '',
  defaultValue = '',
  confirmText,
  cancelText,
}) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle click outside modal
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = inputRef.current?.value.trim() || '';
    if (value) {
      onConfirm(value);
    }
  };

  const handleConfirm = () => {
    const value = inputRef.current?.value.trim() || '';
    if (value) {
      onConfirm(value);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-container" ref={modalRef}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
        </div>
        <form onSubmit={handleSubmit} className="modal-content">
          <input
            ref={inputRef}
            type="text"
            className="modal-input"
            placeholder={placeholder}
            defaultValue={defaultValue}
            autoFocus
          />
        </form>
        <div className="modal-actions">
          <button
            type="button"
            onClick={handleConfirm}
            className="modal-btn modal-btn-confirm"
          >
            {confirmText || t('common.confirm')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="modal-btn modal-btn-cancel"
          >
            {cancelText || t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};
