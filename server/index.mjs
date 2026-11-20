import { createApp } from './app.mjs';
const { app, db, notifications } = await createApp();
notifications.start();
const port = Number(process.env.PORT || 3001), host = process.env.HOST || '127.0.0.1';
const server = app.listen(port, host, () => console.log(`Herby Health API: http://${host}:${port}\nOwner dashboard: ${process.env.APP_ORIGIN || 'http://localhost:5174'}/admin`));
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => { server.close(async () => { await notifications.stop(); db.close(); process.exit(0); }); server.closeIdleConnections(); });
