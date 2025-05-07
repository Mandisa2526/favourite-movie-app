import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/favourite-movie-client/', // Required!
  plugins: [react()]
})
