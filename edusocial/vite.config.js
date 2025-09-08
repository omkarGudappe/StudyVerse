import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react() , tailwindcss()],
  // server: {
  //     host: true, // so it listens on external hosts
  //     allowedHosts: [
  //       '41086301ac7f.ngrok-free.app' // paste your ngrok hostname here
  //   ]
  // }
})
