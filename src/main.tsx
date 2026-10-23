import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { migrateStorage } from './app/legacy';
import { App } from './ui/App';
import './styles.css';

migrateStorage(localStorage);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
