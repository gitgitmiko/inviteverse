import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      // OneDrive sering mengunci file di public/uploads → Vite crash EBUSY
      ignored: ['**/public/uploads/**', '**/reference/**'],
    },
  },
})
