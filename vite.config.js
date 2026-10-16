import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // sockjs-client espera a variável global `global` (Node); no navegador ela não existe.
  define: { global: 'window' },
});
