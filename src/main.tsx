import React from 'react';
import ReactDOM from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n/index';
import { AppProvider } from './contexts/AppContext';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <AppProvider>
        <App />
      </AppProvider>
    </I18nextProvider>
  </React.StrictMode>
);