import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { migrateStorage } from './app/legacy';
import { silentInTests } from './app/silentInTests';
import { safeStorage } from './app/storage';
import { App } from './ui/App';
import { StartFailure } from './ui/StartFailure';
import './styles.css';

silentInTests();
migrateStorage(safeStorage());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StartFailure>
      <App />
    </StartFailure>
  </StrictMode>,
);
