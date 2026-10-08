import { createServer as createViteServer } from 'vite';
import path from 'path';
import express from 'express';
import { createExpressApp } from './backend/src/app';

async function startServer() {
  const app = createExpressApp();
  // Dev server must run on port 3000 to match Nginx proxy
  const port = 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[SEYO Engine] Running on http://0.0.0.0:${port}`);
  });
}

startServer().catch(err => {
  console.error('[SEYO Server] Failed to start:', err);
  process.exit(1);
});
