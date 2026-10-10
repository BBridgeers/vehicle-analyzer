/**
 * Veracar (veracar.co) production server — runs Next.js IN-PROCESS.
 *
 * WHY NOT `next start` / `npm start`:
 *   Both fork a second, detached `next-server` child. When systemd stops the
 *   unit it kills only the wrapper; the child reparents to PID 1, keeps
 *   holding :3001, and every subsequent restart dies with
 *   `EADDRINUSE: address already in use :::3001` — an endless crash loop that
 *   KillMode=control-group cannot reap.
 *
 * Starting Next in-process keeps the unit a SINGLE, cleanly-killable process.
 */
const http = require('http');
const next = require('next');

const port = parseInt(process.env.PORT || '3001', 10);
const host = process.env.BIND_HOST || '0.0.0.0';

const app = next({ dev: false, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    const server = http.createServer((req, res) => handle(req, res));

    server.listen(port, host, () => {
      console.log(`[veracar] ready on http://${host}:${port}`);
    });

    server.on('error', (err) => {
      console.error('[veracar] server error:', err);
      process.exit(1);
    });

    const shutdown = (signal) => {
      console.log(`[veracar] ${signal} received, shutting down`);
      server.close(() => process.exit(0));
      // Hard stop if connections refuse to drain.
      setTimeout(() => process.exit(0), 10000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  })
  .catch((err) => {
    console.error('[veracar] failed to start:', err);
    process.exit(1);
  });
