import crypto from 'crypto';
import Razorpay from 'razorpay';
import { MemoryDB } from '../db/MemoryDB';
import { OnboardingService } from './onboardingService';
import { ProductTier, PRODUCT_TIERS } from '../../../shared/constants/tiers';
import { PaymentRecord, CreateOrderResponse, VerifyPaymentResponse } from '../../../shared/types/payment';
import { generateSecureToken } from '../utils/crypto';

// Server-authoritative pricing configuration (amounts in smallest unit: paise for INR)
export const SERVER_TIER_PRICING: Record<
  ProductTier,
  {
    amount: number; // in paise (e.g. 299900 = ₹2,999.00)
    currency: string;
    displayAmount: string;
    name: string;
  }
> = {
  spin: {
    amount: 299900,
    currency: 'INR',
    displayAmount: '₹2,999',
    name: 'Spin & Win',
  },
  loyalty: {
    amount: 399900,
    currency: 'INR',
    displayAmount: '₹3,999',
    name: 'Loyal Legend',
  },
  review: {
    amount: 199900,
    currency: 'INR',
    displayAmount: '₹1,999',
    name: 'Review Accelerator',
  },
  combined: {
    amount: 599900,
    currency: 'INR',
    displayAmount: '₹5,999',
    name: 'SEYO Combined Suite',
  },
};

export class PaymentService {
  private db: MemoryDB;
  private onboardingService: OnboardingService;
  private razorpayInstance: Razorpay | null = null;
  private keyId: string;
  private keySecret: string;
  private webhookSecret: string;
  private isConfigured: boolean = false;

  constructor() {
    this.db = MemoryDB.getInstance();
    this.onboardingService = new OnboardingService();

    this.keyId = process.env.RAZORPAY_KEY_ID || '';
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || '';
    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

    if (
      this.keyId &&
      this.keySecret &&
      this.keyId !== 'rzp_test_placeholder' &&
      !this.keyId.includes('YOUR_')
    ) {
      try {
        this.razorpayInstance = new Razorpay({
          key_id: this.keyId,
          key_secret: this.keySecret,
        });
        this.isConfigured = true;
      } catch (err) {
        console.error('[PaymentService] Failed to initialize Razorpay SDK:', err);
      }
    }
  }

  public getPublicConfig() {
    return {
      keyId: this.keyId || 'rzp_test_placeholder',
      isLiveConfigured: this.isConfigured,
      currency: 'INR',
      pricing: SERVER_TIER_PRICING,
    };
  }

  /**
   * Create Razorpay Order with server-enforced amount
   */
  public async createOrder(tier: ProductTier, email: string): Promise<CreateOrderResponse> {
    if (!tier || !SERVER_TIER_PRICING[tier]) {
      throw new Error(`Invalid tier requested: ${tier}`);
    }

    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      throw new Error('A valid merchant email is required to associate payment and magic link');
    }

    const tierConfig = SERVER_TIER_PRICING[tier];
    const receipt = `rcpt_${tier}_${Date.now()}`;
    let orderId = '';

    if (this.razorpayInstance && this.isConfigured) {
      try {
        const order = await this.razorpayInstance.orders.create({
          amount: tierConfig.amount,
          currency: tierConfig.currency,
          receipt,
          notes: {
            tier,
            email: normalizedEmail,
            service: 'SEYO Platform Merchant License',
          },
        });
        orderId = order.id;
      } catch (err: any) {
        console.error('[PaymentService] Razorpay order creation failed:', err);
        throw new Error(err.error?.description || err.message || 'Razorpay order creation failed');
      }
    } else {
      // Sandbox fallback order for development/demo review
      orderId = `order_${generateSecureToken(14)}`;
    }

    const paymentRecord: PaymentRecord = {
      id: `pay_${generateSecureToken(12)}`,
      businessEmail: normalizedEmail,
      tier,
      amount: tierConfig.amount,
      currency: tierConfig.currency,
      displayAmount: tierConfig.displayAmount,
      razorpayOrderId: orderId,
      status: 'created',
      createdAt: new Date().toISOString(),
      notes: {
        receipt,
      },
    };

    this.db.savePayment(paymentRecord);

    return {
      success: true,
      orderId,
      amount: tierConfig.amount,
      currency: tierConfig.currency,
      displayAmount: tierConfig.displayAmount,
      keyId: this.keyId || 'rzp_test_placeholder',
      businessEmail: normalizedEmail,
      tier,
      tierName: tierConfig.name,
    };
  }

  /**
   * Verify Razorpay Payment Signature, Amount, and Issue Setup Magic Link
   */
  public async verifyPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): Promise<VerifyPaymentResponse> {
    if (!razorpayOrderId || !razorpayPaymentId) {
      throw new Error('Razorpay order ID and payment ID are required for verification');
    }

    const payment = this.db.getPaymentByOrderId(razorpayOrderId);
    if (!payment) {
      throw new Error('Payment record not found for the supplied Razorpay order ID');
    }

    // Idempotent: If already captured, return the existing magic link
    if (payment.status === 'captured' && payment.magicLinkUrl) {
      return {
        success: true,
        message: 'Payment already verified',
        setupUrl: payment.magicLinkUrl,
        rawToken: payment.magicLinkToken,
        paymentId: payment.id,
        tier: payment.tier,
        email: payment.businessEmail,
      };
    }

    // Cryptographic signature validation
    if (this.keySecret && this.isConfigured) {
      const hmac = crypto.createHmac('sha256', this.keySecret);
      hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
      const expectedSignature = hmac.digest('hex');

      if (expectedSignature !== razorpaySignature) {
        payment.status = 'failed';
        payment.failureReason = 'Cryptographic signature mismatch';
        this.db.savePayment(payment);
        throw new Error('Invalid Razorpay signature. Payment verification failed.');
      }

      // Backend verification against Razorpay API
      if (this.razorpayInstance) {
        try {
          const paymentDetails: any = await this.razorpayInstance.payments.fetch(razorpayPaymentId);
          
          // Verify exact amount and currency from trusted Razorpay server response
          if (paymentDetails.amount !== payment.amount) {
            payment.status = 'failed';
            payment.failureReason = `Amount mismatch: expected ${payment.amount}, received ${paymentDetails.amount}`;
            this.db.savePayment(payment);
            throw new Error('Payment amount verification failed');
          }

          if (paymentDetails.currency !== payment.currency) {
            payment.status = 'failed';
            payment.failureReason = `Currency mismatch: expected ${payment.currency}, received ${paymentDetails.currency}`;
            this.db.savePayment(payment);
            throw new Error('Payment currency verification failed');
          }

          if (paymentDetails.status !== 'captured' && paymentDetails.status !== 'authorized') {
            payment.status = 'failed';
            payment.failureReason = `Unexpected payment status: ${paymentDetails.status}`;
            this.db.savePayment(payment);
            throw new Error(`Payment is not in captured status (${paymentDetails.status})`);
          }
        } catch (fetchErr: any) {
          console.error('[PaymentService] Error fetching Razorpay payment details:', fetchErr);
          throw new Error('Failed to verify payment status with Razorpay gateway');
        }
      }
    } else {
      // In sandbox/demo mode without live API keys:
      // Check that signature is provided
      if (!razorpaySignature) {
        throw new Error('Payment signature is missing');
      }
    }

    // Payment successfully verified!
    payment.status = 'captured';
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.verifiedAt = new Date().toISOString();

    // Generate single-use setup magic link for the merchant
    const magicLinkResult = this.onboardingService.createMagicLink(payment.businessEmail, payment.tier);
    payment.magicLinkUrl = magicLinkResult.setupUrl;
    payment.magicLinkToken = magicLinkResult.rawToken;

    this.db.savePayment(payment);

    return {
      success: true,
      message: 'Payment verified successfully. Onboarding magic link generated.',
      setupUrl: payment.magicLinkUrl,
      rawToken: payment.magicLinkToken,
      paymentId: payment.id,
      tier: payment.tier,
      email: payment.businessEmail,
    };
  }

  /**
   * Handle Razorpay Webhooks idempotently
   */
  public async handleWebhook(rawBody: string | Buffer, signature: string): Promise<{ received: boolean }> {
    if (!this.webhookSecret) {
      console.warn('[PaymentService] Webhook received but RAZORPAY_WEBHOOK_SECRET is not configured');
      return { received: true };
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      throw new Error('Invalid webhook signature');
    }

    const event = typeof rawBody === 'string' ? JSON.parse(rawBody) : JSON.parse(rawBody.toString('utf-8'));
    const eventType = event.event;

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const orderId = event.payload?.payment?.entity?.order_id || event.payload?.order?.entity?.id;
      const paymentId = event.payload?.payment?.entity?.id;

      if (orderId) {
        const payment = this.db.getPaymentByOrderId(orderId);
        if (payment && payment.status !== 'captured') {
          payment.status = 'captured';
          payment.razorpayPaymentId = paymentId || payment.razorpayPaymentId;
          payment.verifiedAt = new Date().toISOString();

          if (!payment.magicLinkUrl) {
            const magicLinkResult = this.onboardingService.createMagicLink(payment.businessEmail, payment.tier);
            payment.magicLinkUrl = magicLinkResult.setupUrl;
            payment.magicLinkToken = magicLinkResult.rawToken;
          }

          this.db.savePayment(payment);
        }
      }
    } else if (eventType === 'payment.failed') {
      const orderId = event.payload?.payment?.entity?.order_id;
      if (orderId) {
        const payment = this.db.getPaymentByOrderId(orderId);
        if (payment && payment.status !== 'captured') {
          payment.status = 'failed';
          payment.failureReason = event.payload?.payment?.entity?.error_description || 'Payment failed';
          this.db.savePayment(payment);
        }
      }
    }

    return { received: true };
  }
}
