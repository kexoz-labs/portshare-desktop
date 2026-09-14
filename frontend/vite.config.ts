import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const apiBase = env.VITE_PORTSHARE_API_BASE?.trim() || process.env.VITE_PORTSHARE_API_BASE?.trim() || 'https://api.portshare.kexoz.dev'
  const rootDomain = env.VITE_PORTSHARE_ROOT_DOMAIN?.trim() || process.env.VITE_PORTSHARE_ROOT_DOMAIN?.trim() || 'portshare.kexoz.dev'

  return {
    base: './',
    define: {
      'import.meta.env.VITE_PORTSHARE_API_BASE': JSON.stringify(apiBase),
      'import.meta.env.VITE_PORTSHARE_ROOT_DOMAIN': JSON.stringify(rootDomain),
    },
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
    },
  }
})
