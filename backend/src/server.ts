import { createApp } from './app.js';
import { ENV } from './config/env.js';

const app = createApp();

app.listen(ENV.PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 Servidor PsychoClinic API iniciado`);
  console.log(`📡 Puerto: http://localhost:${ENV.PORT}`);
  console.log(`🩺 Entorno: ${ENV.NODE_ENV}`);
  console.log(`=========================================`);
});
