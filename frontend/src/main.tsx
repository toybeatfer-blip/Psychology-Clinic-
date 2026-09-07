import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { syncLocalWithCloud } from './lib/cloudSync';
import './index.css';

// Disparo inmediato de sincronización con la nube en arranque
syncLocalWithCloud().catch(() => {});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
