import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Ruta donde se publica el sitio: '/' (cPanel, por defecto) o '/monatekeda-tienda/' (GitHub Pages)
  base: process.env.VITE_BASE || '/',
  plugins: [react(), tailwindcss()],
})
