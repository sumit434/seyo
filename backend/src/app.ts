import express from 'express';
import { apiRouter } from './routes/api.js';
import { seedDatabase } from './seeds/seedBusiness.js';

export function createExpressApp() {
  // Ensure default seeds exist
  seedDatabase();

  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API router mounted under /api
  app.use('/api', apiRouter);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'seyo-platform', time: new Date().toISOString() });
  });

  return app;
}
