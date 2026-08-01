import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  // Paksa base path menggunakan nama repositori persis
  base: '/Web-Pricelist/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // Arahkan @ ke folder src
    },
  },
  build: {
    outDir: 'dist',
  }
});
