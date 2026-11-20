import express from 'express';
import helmet from 'helmet';
import { randomUUID } from 'node:crypto';
import { resolve, join } from 'node:path';
import { existsSync } from 'node:fs';
import { openDatabase, getSettings, mapProduct, mapOrder, transaction, activity } from './database.mjs';
import { createOwner, hashPassword, verifyPassword, readSession, issueSession } from './auth.mjs';
import { ApiError, fail, text, email, phone, integer, object } from './validation.mjs';
import { quote, placeOrder, updateOrder } from './commerce.mjs';
import { uploads, validateFiles, cleanFiles } from './uploads.mjs';

export async function createApp(options = {}) {
  const dataDir = resolve(options.dataDir || process.env.DATA_DIR || '.local');
  const db = openDatabase(dataDir);
  const origin = options.origin || process.env.APP_ORIGIN || 'http://localhost:5174';
  const production = options.production ?? process.env.NODE_ENV === 'production';
  if (production && !origin.startsWith('https://')) { db.close(); throw new Error('APP_ORIGIN must be an HTTPS URL in production.'); }
  const adminEmail = options.adminEmail || process.env.ADMIN_EMAIL, adminPassword = options.adminPassword || process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword && !db.prepare('SELECT id FROM users LIMIT 1').get()) await createOwner(db, adminEmail, adminPassword);
  const dummyHash = await hashPassword(randomUUID());
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'"], imgSrc: ["'self'", 'data:', 'blob:'], fontSrc: ["'self'"], connectSrc: ["'self'"], objectSrc: ["'none'"], frameAncestors: ["'none'"], upgradeInsecureRequests: production ? [] : null } }, strictTransportSecurity: production ? undefined : false }));
  app.use('/api', (req, res, next) => { res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Robots-Tag', 'noindex'); next(); });
  app.use('/api', (req, _res, next) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      const incoming = req.headers.origin;
      if ((incoming && incoming !== origin) || req.headers['sec-fetch-site'] === 'cross-site' || (production && !incoming)) return next(new ApiError(403, 'This request must come from the store.'));
    }
    next();
  });
  app.use(express.json({ limit: '80kb', type: 'application/json' }));
  const rate = (name, limit, duration) => (req, _res, next) => {
    const now = Date.now(), key = `${name}:${req.socket.remoteAddress || 'unknown'}`;
    db.prepare('DELETE FROM rate_limits WHERE resets_at<?').run(now);
    db.prepare('INSERT INTO rate_limits (key,count,resets_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1').run(key, now + duration);
    const record = db.prepare('SELECT count,resets_at FROM rate_limits WHERE key=?').get(key);
    if (record.count > limit) { _res.setHeader('Retry-After', Math.ceil((record.resets_at - now) / 1000)); return next(new ApiError(429, 'Too many requests. Please wait a few minutes and try again.')); }
    next();
  };
  app.use('/api', rate('api', 1000, 60000));
  const requireOwner = (req, _res, next) => {
    const session = readSession(db, req);
    if (!session) return next(new ApiError(401, 'Please sign in to continue.'));
    if (!['GET', 'HEAD'].includes(req.method) && req.headers['x-csrf-token'] !== session.csrf) return next(new ApiError(403, 'Your security token has expired. Sign in again.'));
    req.owner = session; next();
  };
  app.get('/api/health', (_req, res) => { db.prepare('SELECT 1').get(); res.json({ ok: true }); });
  app.get('/api/auth/session', (req, res) => {
    const session = readSession(db, req);
    res.json({ configured: Boolean(db.prepare('SELECT id FROM users LIMIT 1').get()), user: session ? { email: session.email } : null, csrf: session?.csrf || '' });
  });
  app.post('/api/auth/login', rate('login', 10, 15 * 60000), async (req, res) => {
    object(req.body);
    const loginEmail = email(req.body.email); text(req.body.password, 'password', 1, 128); const password = req.body.password;
    const user = db.prepare('SELECT * FROM users WHERE email=?').get(loginEmail);
    const valid = await verifyPassword(password, user?.password_hash || dummyHash);
    if (!user || !valid) { activity(db, 'Sign-in', 'Rejected sign-in attempt', 'Owner access'); fail('Email or password is incorrect.', 401); }
    const existing = readSession(db, req); if (existing) db.prepare('DELETE FROM sessions WHERE token_hash=?').run(existing.token_hash);
    const csrf = issueSession(db, user, res, production);
    activity(db, user.email, 'Signed in', 'Owner access');
    res.json({ user: { email: user.email }, csrf, configured: true });
  });
  app.post('/api/auth/logout', requireOwner, (req, res) => {
    db.prepare('DELETE FROM sessions WHERE token_hash=?').run(req.owner.token_hash);
    res.clearCookie('hh_session', { path: '/', httpOnly: true, sameSite: 'strict', secure: production }); res.json({ ok: true });
  });
  app.get('/api/catalogue', (_req, res) => res.json({ products: db.prepare('SELECT * FROM products ORDER BY rowid').all().map(raw => {
    const { stock, updatedAt, ...product } = mapProduct(raw); return { ...product, available: product.active && (stock === null || stock > 0) };
  }), settings: getSettings(db) }));
  app.post('/api/checkout/quote', rate('quote', 60, 60000), (req, res) => res.json(quote(db, req.body)));
  app.post('/api/orders', rate('orders', 20, 15 * 60000), (req, res) => {
    const order = placeOrder(db, req.body, req.headers['idempotency-key']); res.status(order.duplicate ? 200 : 201).json(order);
  });
  const upload = uploads(dataDir);
  app.post('/api/enquiries', rate('enquiries', 10, 15 * 60000), (req, res, next) => upload(req, res, async error => {
    if (error) { await cleanFiles(req.files); return next(new ApiError(400, error.code === 'LIMIT_FILE_SIZE' ? 'Each file must be 10 MB or smaller.' : 'Choose up to five supported files, each 10 MB or smaller.')); }
    try {
      object(req.body);
      const fields = { name: text(req.body.name, 'first name', 1, 120), surname: text(req.body.surname, 'surname', 1, 120), email: email(req.body.email), phone: phone(req.body.phone), message: text(req.body.message, 'message', 1, 4000) };
      await validateFiles(req.files || []);
      const id = randomUUID(), reference = `HE-${randomUUID().slice(0, 8).toUpperCase()}`, now = new Date().toISOString();
      transaction(db, () => {
        db.prepare('INSERT INTO enquiries (id,reference,name,surname,email,phone,message,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)').run(id, reference, fields.name, fields.surname, fields.email, fields.phone, fields.message, now, now);
        for (const file of req.files || []) db.prepare('INSERT INTO attachments (id,enquiry_id,name,path,mime,size) VALUES (?,?,?,?,?,?)').run(randomUUID(), id, file.safeName, file.filename, file.safeMime, file.size);
        activity(db, 'Storefront', 'Received enquiry', reference);
      });
      res.status(201).json({ reference });
    } catch (error) { await cleanFiles(req.files); next(error); }
  }));
  app.use('/api/admin', requireOwner);
  app.get('/api/admin/products', (_req, res) => res.json(db.prepare('SELECT * FROM products ORDER BY rowid').all().map(mapProduct)));
  app.patch('/api/admin/products/:slug', (req, res) => {
    const raw = db.prepare('SELECT * FROM products WHERE slug=?').get(req.params.slug);
    if (!raw) fail('Ingredient not found.', 404);
    const body = object(req.body), p = mapProduct(raw);
    for (const [key, max] of [['name', 120], ['category', 100], ['description', 4000], ['packSize', 80], ['form', 160]]) if (body[key] !== undefined) p[key] = text(body[key], key, 1, max);
    if (body.price !== undefined) { if (typeof body.price !== 'number' || !Number.isFinite(body.price) || body.price < 0 || body.price > 100000 || Math.abs(body.price * 100 - Math.round(body.price * 100)) > 0.00001) fail('Enter a price from 0 to 100000 with up to two decimal places.'); p.price = body.price; }
    if (body.stock !== undefined) p.stock = body.stock === null ? null : integer(body.stock, 'stock count', 0, 1000000);
    if (body.active !== undefined) { if (typeof body.active !== 'boolean') fail('Choose a valid availability.'); p.active = body.active; }
    db.prepare('UPDATE products SET name=?,category=?,description=?,price=?,pack_size=?,form=?,stock=?,active=?,updated_at=? WHERE slug=?').run(p.name, p.category, p.description, Math.round(p.price * 100), p.packSize, p.form, p.stock, +p.active, new Date().toISOString(), p.slug);
    activity(db, req.owner.email, 'Updated ingredient', p.name); res.json(mapProduct(db.prepare('SELECT * FROM products WHERE slug=?').get(p.slug)));
  });
  app.get('/api/admin/orders', (_req, res) => res.json(db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 1000').all().map(mapOrder)));
  app.patch('/api/admin/orders/:id', (req, res) => res.json(updateOrder(db, req.params.id, req.body, req.owner.email)));
  function enquiries() { return db.prepare('SELECT * FROM enquiries ORDER BY created_at DESC LIMIT 1000').all().map(e => ({ id: e.id, reference: e.reference, name: e.name, surname: e.surname, email: e.email, phone: e.phone, message: e.message, status: e.status, notes: e.notes, createdAt: e.created_at, attachments: db.prepare('SELECT id,name,mime,size FROM attachments WHERE enquiry_id=?').all(e.id) })); }
  app.get('/api/admin/enquiries', (_req, res) => res.json(enquiries()));
  app.patch('/api/admin/enquiries/:id', (req, res) => {
    const e = db.prepare('SELECT * FROM enquiries WHERE id=?').get(req.params.id); if (!e) fail('Enquiry not found.', 404);
    const body = object(req.body), status = body.status ?? e.status, notes = body.notes === undefined ? e.notes : text(body.notes, 'note', 0, 4000);
    if (!['new', 'in-progress', 'resolved'].includes(status)) fail('Choose a valid enquiry status.');
    db.prepare('UPDATE enquiries SET status=?,notes=?,updated_at=? WHERE id=?').run(status, notes, new Date().toISOString(), e.id);
    activity(db, req.owner.email, `Updated enquiry: ${status}`, e.reference); res.json({ ok: true });
  });
  app.get('/api/admin/attachments/:id', (req, res) => {
    const file = db.prepare('SELECT * FROM attachments WHERE id=?').get(req.params.id); if (!file) fail('Attachment not found.', 404);
    res.setHeader('Content-Type', 'application/octet-stream'); res.download(join(dataDir, 'uploads', file.path), file.name);
  });
  app.get('/api/admin/customers', (_req, res) => {
    const customers = new Map();
    for (const raw of db.prepare('SELECT * FROM orders ORDER BY created_at').all()) {
      const order = mapOrder(raw), d = order.details;
      const customer = customers.get(d.email) || { name: d.name, email: d.email, phone: d.phone, orders: 0, paid: 0, enquiries: 0, lastSeen: order.createdAt };
      customer.orders++; if (order.payment === 'paid') customer.paid += order.total;
      customer.lastSeen = order.createdAt; customers.set(d.email, customer);
    }
    for (const e of db.prepare('SELECT * FROM enquiries ORDER BY created_at').all()) {
      const customer = customers.get(e.email) || { name: `${e.name} ${e.surname}`, email: e.email, phone: e.phone, orders: 0, paid: 0, enquiries: 0, lastSeen: e.created_at };
      customer.enquiries++; if (e.created_at > customer.lastSeen) customer.lastSeen = e.created_at; customers.set(e.email, customer);
    }
    res.json([...customers.values()].sort((a, b) => b.lastSeen.localeCompare(a.lastSeen)));
  });
  app.get('/api/admin/settings', (_req, res) => res.json(getSettings(db)));
  app.patch('/api/admin/settings', (req, res) => {
    const body = object(req.body), settings = getSettings(db);
    for (const key of ['businessName', 'email', 'phone', 'address', 'instagram']) if (body[key] !== undefined) settings[key] = text(body[key], key, key === 'businessName' ? 1 : 0, key === 'address' ? 500 : 254);
    if (settings.email) settings.email = email(settings.email);
    if (settings.phone) settings.phone = phone(settings.phone);
    if (settings.instagram) { let url; try { url = new URL(settings.instagram); } catch { fail('Enter a complete Instagram profile URL.'); } if (url.protocol !== 'https:' || !['instagram.com', 'www.instagram.com'].includes(url.hostname)) fail('Use an HTTPS instagram.com profile URL.'); }
    for (const key of ['courierFee', 'freeDelivery']) if (body[key] !== undefined) settings[key] = integer(body[key], key, 0, 100000000);
    if (body.collectionEnabled !== undefined) { if (typeof body.collectionEnabled !== 'boolean') fail('Choose a valid collection setting.'); settings.collectionEnabled = body.collectionEnabled; }
    db.prepare('UPDATE settings SET value=? WHERE id=1').run(JSON.stringify(settings)); activity(db, req.owner.email, 'Updated store settings', 'Store settings'); res.json(settings);
  });
  app.get('/api/admin/activity', (_req, res) => res.json(db.prepare('SELECT * FROM activity ORDER BY id DESC LIMIT 100').all().map(a => ({ ...a, createdAt: a.created_at }))));
  app.get('/api/admin/overview', (_req, res) => {
    const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
    const since = new Date(); since.setUTCDate(since.getUTCDate() - 6); since.setUTCHours(0, 0, 0, 0);
    const days = Array.from({ length: 7 }, (_, i) => { const date = new Date(since); date.setUTCDate(date.getUTCDate() + i); const key = date.toISOString().slice(0, 10); return { date: key, orders: orders.filter(o => o.created_at.startsWith(key)).length }; });
    res.json({ totalOrders: orders.length, pendingOrders: orders.filter(o => o.status === 'pending').length, paidRevenue: orders.filter(o => o.payment === 'paid').reduce((sum, o) => sum + o.total, 0), openEnquiries: db.prepare("SELECT COUNT(*) AS count FROM enquiries WHERE status!='resolved'").get().count, lowStock: db.prepare('SELECT * FROM products WHERE active=1 AND stock IS NOT NULL AND stock<=5 ORDER BY stock').all().map(mapProduct), recentOrders: orders.slice(0, 5).map(mapOrder), days });
  });
  app.use('/api', (_req, _res, next) => next(new ApiError(404, 'API route not found.')));
  const dist = resolve('dist');
  if (existsSync(join(dist, 'index.html'))) {
    // HTML is not cached: saved products and settings are loaded from the API.
    app.use(express.static(dist, { index: false, setHeaders(res, path) { res.setHeader('Cache-Control', path.includes(`${join('assets', '')}`) ? 'public,max-age=31536000,immutable' : 'no-cache'); } }));
    app.get('/admin{/:rest}', (_req, res) => { res.setHeader('X-Robots-Tag', 'noindex'); res.sendFile(join(dist, existsSync(join(dist, 'app-shell.html')) ? 'app-shell.html' : 'index.html')); });
    app.get('/{*rest}', (_req, res) => res.sendFile(join(dist, 'index.html')));
  }
  app.use((error, req, res, _next) => {
    const status = error.status || (error.type === 'entity.too.large' ? 413 : error instanceof SyntaxError ? 400 : 500);
    if (status === 500) console.error('API error:', error.message);
    if (!res.headersSent) res.status(status).json({ error: status === 500 ? 'Something went wrong. Please try again.' : error.message });
  });
  return { app, db };
}
