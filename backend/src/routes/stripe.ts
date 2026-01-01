import express, { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

/**
 * Stripe webhook endpoint
 * Must be configured in Stripe dashboard with webhook secret
 * Note: This route must use express.raw() middleware (configured in index.ts)
 */
router.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;

  if (!sig) {
    logger.warn('Stripe webhook called without signature');
    return res.status(400).json({ message: 'Missing stripe-signature header' });
  }

  if (!env.STRIPE_WEBHOOK_SECRET) {
    logger.error('STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ message: 'Webhook secret not configured' });
  }

  try {
    // req.body is Buffer when using express.raw() middleware
    const body = req.body as Buffer;
    
    // Verify webhook signature
    const event = verifyStripeSignature(body, sig, env.STRIPE_WEBHOOK_SECRET);

    logger.info('Stripe webhook received', { type: event.type, id: event.id });

    // Handle different event types
    switch (event.type) {
      case 'account.updated':
        await handleAccountUpdated(event.data.object);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'transfer.created':
        await handleTransferCreated(event.data.object);
        break;

      case 'charge.dispute.created':
        await handleDisputeCreated(event.data.object);
        break;

      default:
        logger.debug('Unhandled Stripe event type', { type: event.type });
    }

    // Acknowledge receipt
    res.json({ received: true });
  } catch (error: any) {
    logger.error('Stripe webhook error', error);
    
    if (error.message === 'Invalid signature') {
      return res.status(400).json({ message: 'Invalid signature' });
    }

    return res.status(500).json({ message: 'Webhook processing failed' });
  }
});

function verifyStripeSignature(payload: Buffer, signature: string, secret: string): any {
  const elements = signature.split(',');
  const signatureHash = elements.find((el) => el.startsWith('v1='))?.split('=')[1];

  if (!signatureHash) {
    throw new Error('Invalid signature format');
  }

  const timestamp = elements.find((el) => el.startsWith('t='))?.split('=')[1];
  if (!timestamp) {
    throw new Error('Invalid signature format');
  }

  // Verify timestamp (prevent replay attacks)
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - parseInt(timestamp)) > 300) {
    throw new Error('Timestamp too old');
  }

  // Compute signature
  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  if (signatureHash !== expectedSignature) {
    throw new Error('Invalid signature');
  }

  // Parse event (payload is already a Buffer from express.raw())
  return JSON.parse(payload.toString('utf8'));
}

async function handleAccountUpdated(account: any) {
  logger.info('Stripe account updated', { accountId: account.id });
  // TODO: Update contractor's Stripe account status in database
}

async function handlePaymentSucceeded(paymentIntent: any) {
  logger.info('Payment succeeded', { paymentIntentId: paymentIntent.id });
  // TODO: Update escrow transaction status
}

async function handleTransferCreated(transfer: any) {
  logger.info('Transfer created', { transferId: transfer.id });
  // TODO: Update escrow transaction with transfer ID
}

async function handleDisputeCreated(dispute: any) {
  logger.info('Dispute created', { disputeId: dispute.id });
  // TODO: Create dispute record in database
}

export { router as stripeRouter };

