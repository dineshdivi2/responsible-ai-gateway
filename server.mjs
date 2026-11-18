import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assess, variants } from './assessment.mjs';

const assets = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
]);
const actions = ['Request evidence', 'Refer to specialist', 'Approve within assessed scope', 'Decline'];
const publicDir = new URL('./public/', import.meta.url);

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}

async function readJson(req) {
  if (!req.headers['content-type']?.startsWith('application/json')) {
    throw Object.assign(new Error('Expected JSON'), { status: 415 });
  }
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 16000) throw Object.assign(new Error('Request is too large'), { status: 413 });
    chunks.push(chunk);
  }
  let body;
  try { body = JSON.parse(Buffer.concat(chunks)); }
  catch { throw Object.assign(new Error('Invalid JSON'), { status: 400 }); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw Object.assign(new Error('Expected a JSON object'), { status: 400 });
  }
  return body;
}

export function createGateway(dataDir) {
  mkdirSync(dataDir, { recursive: true });
  const storePath = join(dataDir, 'reviews.json');
  const load = () => existsSync(storePath) ? JSON.parse(readFileSync(storePath, 'utf8')) : [];
  function save(runs) {
    const temporary = storePath + '.tmp';
    writeFileSync(temporary, JSON.stringify(runs, null, 2), 'utf8');
    renameSync(temporary, storePath);
  }

  return createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'self'; object-src 'none'; frame-ancestors 'self'; base-uri 'none'");
    try {
      const path = new URL(req.url, 'http://localhost').pathname;
      if (req.method === 'GET' && assets.has(path)) {
        const [file, contentType] = assets.get(path);
        res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-cache' });
        res.end(readFileSync(new URL(file, publicDir)));
        return;
      }
      if (req.method === 'GET' && path === '/api/reviews') {
        const runs = load();
        json(res, 200, { variants: Object.entries(variants).map(([id, value]) => ({ id, label: value.label })),
          latest: runs.at(-1) ?? null, history: runs.slice().reverse().map(run => ({
            id: run.id, variant: run.variant, revision: run.submission.revision, createdAt: run.createdAt, decision: run.decisions.at(-1)?.action ?? 'Pending',
          })) });
        return;
      }
      if (req.method === 'POST' && path === '/api/reviews') {
        const { variant } = await readJson(req);
        if (typeof variant !== 'string' || !Object.hasOwn(variants, variant)) {
          json(res, 400, { error: 'Choose a listed submission revision.' });
          return;
        }
        const runs = load();
        const run = { id: randomUUID(), createdAt: new Date().toISOString(), decisions: [], ...assess(variant) };
        save([...runs, run]);
        json(res, 201, run);
        return;
      }
      const match = /^\/api\/reviews\/([a-f0-9-]+)(\/decisions)?$/.exec(path);
      if (match && req.method === 'GET' && !match[2]) {
        const run = load().find(item => item.id === match[1]);
        json(res, run ? 200 : 404, run ?? { error: 'Review not found.' });
        return;
      }
      if (match?.[2] && req.method === 'POST') {
        const { action, rationale } = await readJson(req);
        if (!actions.includes(action) || typeof rationale !== 'string' || !rationale.trim() || rationale.length > 2000) {
          json(res, 400, { error: 'Choose a disposition and enter a rationale of up to 2,000 characters.' });
          return;
        }
        const runs = load();
        const run = runs.find(item => item.id === match[1]);
        if (!run) {
          json(res, 404, { error: 'Review not found.' });
          return;
        }
        const decision = { action, rationale: rationale.trim(), reviewer: 'Demo reviewer', recordedAt: new Date().toISOString(),
          requests: action === 'Request evidence' ? run.requests : [] };
        run.decisions.push(decision);
        save(runs);
        json(res, 201, run);
        return;
      }
      json(res, 404, { error: 'Not found.' });
    } catch (error) {
      json(res, error.status ?? 500, { error: error.status ? error.message : 'The local gateway could not complete this request.' });
      if (!error.status) console.error(error);
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const privateDir = process.env.GATEWAY_DATA_DIR ?? fileURLToPath(new URL('./.gateway-data/', import.meta.url));
  const port = Number(process.env.PORT ?? 8788);
  createGateway(privateDir).listen(port, '127.0.0.1', () => console.log('Review gateway at http://127.0.0.1:' + port));
}
