import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { handleChatApi, handleHealthApi, handleHistoryApi } from './server/gemini.ts'

function chatApiPlugin(): Plugin {
  return {
    name: 'chat-api-plugin',
    configureServer(server) {
      // Force no-cache headers for all dev responses so Chrome always fetches fresh
      server.middlewares.use((_req, res, next) => {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
        res.setHeader('Pragma', 'no-cache')
        res.setHeader('Expires', '0')
        next()
      })
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0]
        if (url === '/api/chat' && req.method === 'POST') {
          handleChatApi(req, res)
        } else if (url === '/api/health' && req.method === 'GET') {
          handleHealthApi(req, res)
        } else if (url === '/api/history' && (req.method === 'GET' || req.method === 'POST')) {
          handleHistoryApi(req, res)
        } else {
          next()
        }
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0]
        if (url === '/api/chat' && req.method === 'POST') {
          handleChatApi(req, res)
        } else if (url === '/api/health' && req.method === 'GET') {
          handleHealthApi(req, res)
        } else if (url === '/api/history' && (req.method === 'GET' || req.method === 'POST')) {
          handleHistoryApi(req, res)
        } else {
          next()
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), chatApiPlugin()],
})
