import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { handleAsNodeRequest } from 'cloudflare:node';

// One Node HTTP bridge per isolate, with a request-local app selected before
// Express runs. Database handles are never shared between Durable Objects.
const requests = new Map();
createServer((req, res) => {
  const app = requests.get(req.headers['x-herby-internal-request']);
  delete req.headers['x-herby-internal-request'];
  if (!app) { res.writeHead(503); res.end(); return; }
  app(req, res);
}).listen(8080);

export async function expressResponse(app, request) {
  const key = randomUUID();
  const headers = new Headers(request.headers);
  headers.set('x-herby-internal-request', key);
  requests.set(key, app);
  try { return await handleAsNodeRequest(8080, new Request(request, { headers })); }
  finally { requests.delete(key); }
}
