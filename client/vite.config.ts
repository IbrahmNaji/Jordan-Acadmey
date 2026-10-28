import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  if (command === 'build' && mode === 'production') {
    const apiUrl = env.VITE_API_URL?.trim()
    const siteUrl = env.VITE_SITE_URL?.trim()
    if (!apiUrl || !siteUrl) {
      throw new Error('Production builds require VITE_API_URL and VITE_SITE_URL.')
    }

    const api = new URL(apiUrl)
    const site = new URL(siteUrl)
    if (
      api.protocol !== 'https:' ||
      api.pathname.replace(/\/$/, '') !== '/api' ||
      site.protocol !== 'https:' ||
      site.origin !== siteUrl
    ) {
      throw new Error('Production API and site URLs must be HTTPS; VITE_API_URL must end in /api and VITE_SITE_URL must be an origin.')
    }
  }

  return {
    plugins: [react()],
  }
})
