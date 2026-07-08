import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' — чтобы собранная статика работала с любого пути при деплое
export default defineConfig({
  plugins: [react()],
  base: './',
});
