import { DurableObject } from 'cloudflare:workers';
import { timingSafeEqual } from 'node:crypto';
import { createApp } from '../server/app.mjs';
import { initializeDatabase, transaction } from '../server/database.mjs';
import { pages } from '../src/data/pages.mjs';
import { products } from '../src/data/catalogue.mjs';
import { createSqlAdapter, createPrivateFiles } from './storage.mjs';
import { expressResponse } from './bridge.mjs';

const routes = new Set([...pages.map(page => page.path), ...products.map(product => `/products/${product.slug}`)]);
const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

function secured(response, { privateResponse = false, https = true } = {}) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(securityHeaders)) headers.set(name, value);
  if (https) headers.set('Strict-Transport-Security', 'max-age=31536000');
  if (privateResponse) { headers.set('Cache-Control', 'no-store'); headers.set('X-Robots-Tag', 'noindex, nofollow'); }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function validSetupToken(request, expected) {
  if (!expected) return false;
  const provided = request.headers.get('authorization')?.replace(/^Bearer /, '') || '';
  const a = Buffer.from(provided), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export class HerbyStore extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      this.db = initializeDatabase(createSqlAdapter(ctx.storage), { setUserVersion: false });
      this.db.exec('CREATE TABLE IF NOT EXISTS deployment_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
      this.files = createPrivateFiles(this.db);
      const origin = new URL(env.APP_ORIGIN).origin;
      const application = await createApp({
        database: this.db, files: this.files, origin,
        production: origin.startsWith('https://'), staticAssets: false,
        clientAddress: req => req.headers['x-herby-client-ip'],
        integrations: {
          paystackKey: env.PAYSTACK_SECRET_KEY || '', paystackWebhookSecret: env.PAYSTACK_WEBHOOK_SECRET || '',
          resendKey: env.RESEND_API_KEY || '', resendWebhookSecret: env.RESEND_WEBHOOK_SECRET || '',
          emailFrom: env.EMAIL_FROM || '', replyTo: env.EMAIL_REPLY_TO || '', notifyEmail: env.NOTIFICATION_EMAIL || '',
        },
      });
      this.app = application.app;
      this.notifications = application.notifications;
      this.emailEnabled = application.config.emailEnabled;
      await this.scheduleNotifications();
    });
  }

  importSnapshot(snapshot) {
    if (this.db.prepare("SELECT value FROM deployment_meta WHERE key='setup-complete'").get()) throw new Error('Store setup has already completed.');
    if (!snapshot || snapshot.version !== 1 || !Array.isArray(snapshot.tables)) throw new Error('Invalid store snapshot.');
    const ignored = new Set(['sessions', 'rate_limits', 'deployment_meta', 'attachment_chunks']);
    const known = new Set(this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(row => row.name));
    return transaction(this.db, () => {
      for (const table of snapshot.tables) {
        if (!known.has(table.name) || ignored.has(table.name) || !/^[a-z_]+$/.test(table.name)) throw new Error('Unsupported snapshot table.');
        const columns = new Set(this.db.prepare(`PRAGMA table_info(${table.name})`).all().map(column => column.name));
        if (!Array.isArray(table.columns) || !table.columns.length || !table.columns.every(column => columns.has(column) && /^[a-z_]+$/.test(column)) || !Array.isArray(table.rows)) throw new Error('Invalid snapshot columns.');
        this.db.prepare(`DELETE FROM ${table.name}`).run();
        const insert = this.db.prepare(`INSERT INTO ${table.name} (${table.columns.join(',')}) VALUES (${table.columns.map(() => '?').join(',')})`);
        for (const row of table.rows) {
          if (!Array.isArray(row) || row.length !== table.columns.length) throw new Error('Invalid snapshot row.');
          insert.run(...row);
        }
      }
      for (const file of snapshot.files || []) {
        if (!/^[a-f0-9-]+$/.test(file.key) || typeof file.base64 !== 'string') throw new Error('Invalid private file.');
        this.files.persist([{ filename: file.key, buffer: Buffer.from(file.base64, 'base64') }]);
      }
      if (!this.db.prepare('SELECT id FROM users LIMIT 1').get()) throw new Error('An owner account is required before public setup completes.');
      this.db.prepare("INSERT INTO deployment_meta VALUES ('setup-complete',?)").run(new Date().toISOString());
      return { ok: true };
    });
  }

  async fetch(request) {
    if (!this.db.prepare("SELECT value FROM deployment_meta WHERE key='setup-complete'").get()) {
      return Response.json({ error: 'The store is being set up. Please try again shortly.' }, { status: 503 });
    }
    try { return await expressResponse(this.app, request); }
    finally { this.ctx.waitUntil(this.scheduleNotifications()); }
  }

  async scheduleNotifications() {
    if (!this.emailEnabled) return;
    const row = this.db.prepare("SELECT MIN(CASE WHEN next_attempt_at>locked_until THEN next_attempt_at ELSE locked_until END) AS due FROM email_outbox WHERE state IN ('queued','retry','blocked','sending')").get();
    if (row?.due === null || row?.due === undefined) return;
    const due = Math.max(Date.now() + 1000, row.due);
    const current = await this.ctx.storage.getAlarm();
    if (current === null || current > due) await this.ctx.storage.setAlarm(due);
  }

  async alarm() {
    if (!this.emailEnabled) return;
    await this.notifications.process({ limit: 10 });
    await this.scheduleNotifications();
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const isApi = url.pathname === '/api' || url.pathname.startsWith('/api/');
    try {
      if (url.pathname.startsWith('/__setup')) {
        if (url.pathname !== '/__setup/import' || request.method !== 'POST' || !validSetupToken(request, env.MIGRATION_TOKEN)) return secured(new Response('Not found', { status: 404 }), { privateResponse: true });
        const result = await env.STORE.getByName('store').importSnapshot(await request.json());
        return secured(Response.json(result), { privateResponse: true });
      }
      if (isApi) {
        // Cloudflare supplies CF-Connecting-IP; client-provided internal headers
        // are replaced before the request enters the private Durable Object.
        const headers = new Headers(request.headers);
        headers.delete('x-herby-internal-request');
        headers.set('x-herby-client-ip', request.headers.get('cf-connecting-ip') || 'unknown');
        const response = await env.STORE.getByName('store').fetch(new Request(request, { headers }));
        return secured(response, { privateResponse: true, https: url.protocol === 'https:' });
      }
      if (!['GET', 'HEAD'].includes(request.method)) return secured(new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } }));
      if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
        url.pathname = url.pathname.slice(0, -1);
        return secured(Response.redirect(url, 308));
      }
      const admin = url.pathname === '/admin' || url.pathname.startsWith('/admin/');
      const privateShell = admin || url.pathname === '/checkout/payment';
      const assetUrl = new URL(url);
      if (privateShell) assetUrl.pathname = '/app-shell.html';
      else if (url.pathname === '/') assetUrl.pathname = '/index.html';
      else if (routes.has(url.pathname)) assetUrl.pathname = `${url.pathname}/index.html`;
      let response = await env.ASSETS.fetch(new Request(assetUrl, request));
      if (response.status === 404 && !url.pathname.split('/').pop().includes('.')) {
        assetUrl.pathname = '/app-shell.html';
        const shell = await env.ASSETS.fetch(new Request(assetUrl, request));
        response = new Response(shell.body, { status: 404, headers: shell.headers });
      }
      const result = secured(response, { privateResponse: privateShell, https: url.protocol === 'https:' });
      if (!privateShell && result.headers.get('content-type')?.includes('text/html')) result.headers.set('Cache-Control', 'no-cache');
      if (url.pathname.startsWith('/assets/')) result.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      return result;
    } catch (error) {
      console.error('Cloudflare request failed:', error.message);
      return secured(Response.json({ error: 'The store service is temporarily unavailable. Please try again.' }, { status: 503 }), { privateResponse: true });
    }
  },
};
