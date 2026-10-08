import { Router, Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/paymentService';

const router = Router();
const paymentService = new PaymentService();

// Get public payment configuration (Razorpay key_id and tier pricing)
router.get('/config', (req: Request, res: Response) => {
  res.json({
    success: true,
    ...paymentService.getPublicConfig(),
  });
});

// Create Razorpay Order
router.post('/create-order', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tier, email } = req.body;
    if (!tier || !email) {
      return res.status(400).json({
        success: false,
        message: 'Tier and merchant email are required',
      });
    }

    const orderData = await paymentService.createOrder(tier, email);
    res.json(orderData);
  } catch (err: any) {
    next(err);
  }
});

// Verify Payment and Issue Setup Magic Link
router.post('/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId) {
      return res.status(400).json({
        success: false,
        message: 'Razorpay order ID and payment ID are required',
      });
    }

    const result = await paymentService.verifyPayment(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature || ''
    );

    res.json(result);
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: err.message || 'Payment verification failed',
    });
  }
});

// Razorpay Webhook
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const signature = (req.headers['x-razorpay-signature'] as string) || '';
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    const result = await paymentService.handleWebhook(rawBody, signature);
    res.json(result);
  } catch (err: any) {
    console.error('[PaymentRoutes] Webhook verification error:', err.message);
    res.status(400).json({
      success: false,
      message: err.message || 'Webhook verification failed',
    });
  }
});

export default router;
