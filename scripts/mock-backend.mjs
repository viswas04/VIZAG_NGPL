/**
 * LOCAL DEVELOPMENT MOCK of the Apps Script web app (run: npm run mock:backend)
 * Executes the real apps-script/Code.gs against an in-memory spreadsheet.
 *
 *   VITE_BACKEND_URL=http://localhost:8787   -> point the site at this server
 *   MOCK_FAIL_WRITES=1                       -> simulate a Google Sheets outage
 *   ADMIN_KEY=...                            -> admin key (default: local-admin-key-0000)
 *   GET /__dump                              -> view the emulated tabs (local only)
 *
 * Data is NOT written to Google Sheets. For development/testing only.
 */
import http from 'node:http'
import { createBackend } from './apps-script-harness.mjs'

const PORT = Number(process.env.MOCK_PORT || 8787)
const backend = createBackend({
  adminKey: process.env.ADMIN_KEY || 'local-admin-key-0000',
  failWrites: process.env.MOCK_FAIL_WRITES === '1',
})
backend.context.setup?.()
if (process.env.MOCK_FAIL_WRITES === '1') backend.env.failWrites = true

const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }

http
  .createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`)
    if (req.method === 'OPTIONS') {
      res.writeHead(204, { ...cors, 'Access-Control-Allow-Headers': 'Content-Type' })
      return res.end()
    }
    if (req.method === 'GET' && url.pathname === '/__dump') {
      const dump = Object.fromEntries([...backend.spreadsheet.sheets].map(([n, s]) => [n, s.toObjects()]))
      res.writeHead(200, cors)
      return res.end(JSON.stringify(dump, null, 2))
    }
    if (req.method === 'GET' && url.pathname === '/__fail') {
      backend.env.failWrites = url.searchParams.get('on') === '1'
      res.writeHead(200, cors)
      return res.end(JSON.stringify({ failWrites: backend.env.failWrites }))
    }
    if (req.method === 'GET') {
      res.writeHead(200, cors)
      return res.end(JSON.stringify(backend.get(Object.fromEntries(url.searchParams))))
    }
    let body = ''
    req.on('data', (c) => (body += c))
    req.on('end', () => {
      const out = backend.context.doPost({ postData: { contents: body } })
      const json = JSON.parse(out.getContent())
      console.log(`[mock] ${json.ok ? 'OK ' : 'ERR'} ${safeAction(body)} ${json.ok ? '' : json.code}`)
      res.writeHead(200, cors)
      res.end(out.getContent())
    })
  })
  .listen(PORT, () => {
    console.log(`NGPL mock Apps Script backend on http://localhost:${PORT} (in-memory, NOT Google Sheets)`)
    console.log(`failWrites=${backend.env.failWrites}`)
  })

function safeAction(body) {
  try { return JSON.parse(body).action } catch { return '?' }
}
