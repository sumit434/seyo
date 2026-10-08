import express, { Express } from 'express';
import onboardingRoutes from './routes/onboardingRoutes';
import entryRoutes from './routes/entryRoutes';
import customerAuthRoutes from './routes/customerAuthRoutes';
import customerRoutes from './routes/customerRoutes';
import staffRoutes from './routes/staffRoutes';
import paymentRoutes from './routes/paymentRoutes';
import developerRoutes from './routes/developerRoutes';
import { errorMiddleware } from './middleware/errorMiddleware';

export function createExpressApp(): Express {
  const app = express();

  // Middleware with rawBody preservation for payment webhooks
  app.use(
    express.json({
      limit: '5mb',
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    })
  );
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  // Security Headers & CORS
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      platform: 'SEYO Merchant & Customer Platform',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API Routes
  app.use('/api/onboarding', onboardingRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/entry', entryRoutes);
  // Conceptual shorthand /tap/:slug redirects to /api/entry/tap/:slug
  app.use('/tap', (req, res) => {
    res.redirect(302, `/api/entry/tap${req.url}`);
  });
  app.use('/api/auth', customerAuthRoutes);
  app.use('/api/customer', customerRoutes);
  app.use('/api/staff', staffRoutes);
  app.use('/api/developer', developerRoutes);

  // Central Error Handler
  app.use(errorMiddleware);

  return app;
}
