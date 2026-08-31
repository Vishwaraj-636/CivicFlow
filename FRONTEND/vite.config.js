import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

//sari api jo backend me hai usko frontend ke sath connect karne ke liye proxy ka use karte hai
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  server:{
    proxy:{
      "/api":{
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
