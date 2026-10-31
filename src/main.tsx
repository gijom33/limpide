import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { migrateStorage } from './app/legacy';
import { silentInTests } from './app/silentInTests';
import { safeStorage } from './app/storage';
import { App } from './ui/App';
import { C16Card } from './ui/C16Card';
import { StartFailure } from './ui/StartFailure';
import './styles.css';

silentInTests();
migrateStorage(safeStorage());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StartFailure>
      {/* The C16's card to print (issue 145), on a page of its own, opened from the MIDI panel. */}
      {location.hash === '#c16-card' ? <C16Card /> : <App />}
    </StartFailure>
  </StrictMode>,
);
