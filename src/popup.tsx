import React from 'react';
import { createRoot } from 'react-dom/client';
import { TasksManager } from './components/TasksManager';
import { TranslationProvider } from './i18n/TranslationContext';
import './styles/global.css';
import './styles/language-selector.css';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <TranslationProvider>
        <TasksManager />
      </TranslationProvider>
    </React.StrictMode>
  );
} 