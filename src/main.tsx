import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';

import ThemeProvider from '~/providers/ThemeProvider';

import App from './App';

Sentry.init({
  dsn: 'https://741e6611f536afcbb507dc8ff10c4553@o23412.ingest.us.sentry.io/4510694826508288',
  environment: import.meta.env.MODE,
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
