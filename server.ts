import express from 'express';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import axios from 'axios';
import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
const firebaseConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'firebase-applet-config.json'), 'utf8')
);

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

const db = firebaseConfig.firestoreDatabaseId
  ? admin.firestore(firebaseConfig.firestoreDatabaseId)
  : admin.firestore();

type NormalizedOrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled';

interface CreatePaymentBody {
  giftId?: string;
  quantity?: number;
  guestEmail: string;
  guestName: string;
  cartItems?: Array<{
    giftId: string;
    name?: string;
    unitPrice?: number;
    quantity: number;
  }>;
  printedCard?: {
    enabled?: boolean;
    signerName?: string;
    message?: string;
    fee?: number;
  };
}

interface PaymentCreateResult {
  externalPaymentId?: string;
  paymentUrl?: string;
  pixCode?: string;
  qrCodeBase64?: string;
  raw: unknown;
}

const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
const paymentMode = (process.env.PAYMENT_MODE || 'mock').toLowerCase();
const infinitePayApiBaseUrl = process.env.INFINITEPAY_API_BASE_URL || 'https://api.infinitepay.io';
const infinitePayCreatePath = process.env.INFINITEPAY_CREATE_PATH || '/v1/payments';
const infinitePayApiToken = process.env.INFINITEPAY_API_TOKEN || '';
const infinitePayWebhookSecret = process.env.INFINITEPAY_WEBHOOK_SECRET || '';
const allowInsecureWebhook = process.env.ALLOW_INSECURE_WEBHOOK === 'true';

function parseNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
  }
  return NaN;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function sanitizeStatus(status: string | undefined | null): NormalizedOrderStatus {
  const normalized = (status || '').toLowerCase();
  if (['paid', 'approved', 'succeeded', 'success', 'completed'].includes(normalized)) return 'paid';
  if (['failed', 'rejected', 'error'].includes(normalized)) return 'failed';
  if (['cancelled', 'canceled', 'expired', 'voided'].includes(normalized)) return 'cancelled';
  return 'pending';
}

function verifyWebhookSignature(rawBody: string, signatureHeader?: string | string[]): boolean {
  if (!infinitePayWebhookSecret) {
    return allowInsecureWebhook;
  }

  if (!signatureHeader || Array.isArray(signatureHeader)) {
    return false;
  }

  const incoming = signatureHeader.startsWith('sha256=')
    ? signatureHeader.replace('sha256=', '')
    : signatureHeader;
  const digest = crypto.createHmac('sha256', infinitePayWebhookSecret).update(rawBody, 'utf8').digest('hex');
  return crypto.timingSafeEqual(Buffer.from(incoming), Buffer.from(digest));
}

async function createProviderPayment(params: {
  orderId: string;
  amount: number;
  description: string;
  customerName: string;
  customerEmail: string;
}): Promise<PaymentCreateResult> {
  if (paymentMode === 'pix_manual') {
    return {
      paymentUrl: process.env.PIX_PAYMENT_URL || '',
      pixCode: process.env.PIX_COPY_PASTE_CODE || '',
      raw: { mode: 'pix_manual' },
    };
  }

  if (paymentMode === 'infinitepay') {
    const endpoint = `${infinitePayApiBaseUrl}${infinitePayCreatePath}`;
    const payload = {
      amount: params.amount,
      currency: 'BRL',
      externalReference: params.orderId,
      description: params.description,
      customer: {
        name: params.customerName,
        email: params.customerEmail,
      },
      notificationUrl: `${appBaseUrl}/api/payments/webhook`,
      successUrl: `${appBaseUrl}/payment/${params.orderId}?result=success`,
      cancelUrl: `${appBaseUrl}/payment/${params.orderId}?result=cancelled`,
    };

    const response = await axios.post(endpoint, payload, {
      headers: {
        'Content-Type': 'application/json',
        ...(infinitePayApiToken ? { Authorization: `Bearer ${infinitePayApiToken}` } : {}),
      },
      timeout: 20000,
    });

    const data = response.data || {};
    return {
      externalPaymentId: data.id || data.paymentId || data.chargeId,
      paymentUrl: data.paymentUrl || data.checkoutUrl || data.payment_link,
      pixCode: data.pixCode || data.pix?.copyPaste || data.pix?.emv,
      qrCodeBase64: data.qrCodeBase64 || data.pix?.qrCodeBase64,
      raw: data,
    };
  }

  return {
    paymentUrl: `${appBaseUrl}/payment/${params.orderId}?result=mock`,
    raw: { mode: 'mock' },
  };
}

async function seedDatabase() {
  if (process.env.ENABLE_DATA_SEED !== 'true') {
    return;
  }

  try {
    const weddingRef = db.collection('wedding').doc('info');
    const doc = await weddingRef.get();
    if (!doc.exists) {
      await weddingRef.set(
        {
          coupleNames: 'Bruna e Leonardo',
          weddingDate: '2026-11-07T18:00:00-03:00',
          story:
            'Nossa história começou com um encontro inesperado e se transformou no amor de nossas vidas. Estamos ansiosos para celebrar este novo capítulo com vocês!',
          locationName: 'Igreja Santa Terezinha do Menino Jesus',
          locationAddress: 'São José do Rio Preto - SP',
          ceremonyLocationName: 'Igreja Santa Terezinha do Menino Jesus',
          ceremonyLocationAddress: 'São José do Rio Preto - SP',
          receptionLocationName: 'Chácara VIVA 1',
          receptionLocationAddress: 'São José do Rio Preto - SP',
          locationMapUrl:
            'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.1975!2d-46.658!3d-23.563!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjPCsDMzJzQ2LjgiUyA0NsKwMzknMjguOCJX!5e0!3m2!1spt-BR!2sbr!4v1620000000000!5m2!1spt-BR!2sbr',
          dressCode: 'Passeio Completo',
          homeImageUrl:
            'https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
        },
        { merge: true }
      );
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

seedDatabase();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        (req as express.Request & { rawBody?: string }).rawBody = buf.toString('utf8');
      },
    })
  );

  app.post('/api/payments/create', async (req, res) => {
    const payload = (req.body || {}) as CreatePaymentBody;
    const { giftId, quantity, guestEmail, guestName, cartItems = [], printedCard } = payload;

    try {
      if (!isNonEmptyString(guestName) || !isNonEmptyString(guestEmail)) {
        return res.status(400).json({ error: 'Nome e e-mail são obrigatórios.' });
      }

      const normalizedItems: Array<{
        giftId: string;
        giftName: string;
        quantity: number;
        unitPrice: number;
        totalAmount: number;
        managedByInventory: boolean;
      }> = [];

      const incomingItems =
        Array.isArray(cartItems) && cartItems.length > 0
          ? cartItems
          : [{ giftId: giftId || '', quantity: Math.floor(parseNumber(quantity)) }];

      for (const item of incomingItems) {
        if (!isNonEmptyString(item.giftId)) {
          return res.status(400).json({ error: 'Item de presente inválido.' });
        }
        const safeQuantity = Math.floor(parseNumber(item.quantity));
        if (!Number.isInteger(safeQuantity) || safeQuantity <= 0) {
          return res.status(400).json({ error: `Quantidade inválida para ${item.giftId}.` });
        }

        const giftRef = db.collection('gifts').doc(item.giftId);
        const giftDoc = await giftRef.get();
        if (giftDoc.exists) {
          const giftData = giftDoc.data()!;
          const giftPrice = parseNumber(giftData.price);
          const available = Math.floor(parseNumber(giftData.availableQuantity));
          if (!Number.isFinite(giftPrice) || giftPrice < 0) {
            return res.status(400).json({ error: `Preço inválido no presente ${item.giftId}.` });
          }
          if (safeQuantity > available) {
            return res.status(409).json({ error: `Quantidade maior que estoque para ${giftData.name}.` });
          }
          normalizedItems.push({
            giftId: item.giftId,
            giftName: String(giftData.name || 'Presente'),
            quantity: safeQuantity,
            unitPrice: giftPrice,
            totalAmount: Number((giftPrice * safeQuantity).toFixed(2)),
            managedByInventory: true,
          });
        } else {
          // fallback for fictitious catalog items used in demo/landing flows
          if (paymentMode === 'infinitepay') {
            return res.status(404).json({ error: `Presente não encontrado: ${item.giftId}` });
          }
          const unitPrice = parseNumber(item.unitPrice);
          if (!isNonEmptyString(item.name) || !Number.isFinite(unitPrice) || unitPrice <= 0) {
            return res.status(400).json({ error: `Item custom inválido: ${item.giftId}` });
          }
          normalizedItems.push({
            giftId: item.giftId,
            giftName: item.name.trim(),
            quantity: safeQuantity,
            unitPrice,
            totalAmount: Number((unitPrice * safeQuantity).toFixed(2)),
            managedByInventory: false,
          });
        }
      }

      if (normalizedItems.length === 0) {
        return res.status(400).json({ error: 'Carrinho vazio.' });
      }

      const cardEnabled = Boolean(printedCard?.enabled);
      const cardFee = cardEnabled ? Math.max(0, Number(parseNumber(printedCard?.fee) || 0)) : 0;
      const itemsTotal = normalizedItems.reduce((acc, item) => acc + item.totalAmount, 0);
      const totalAmount = Number((itemsTotal + cardFee).toFixed(2));
      const firstItem = normalizedItems[0];

      const orderRef = await db.collection('orders').add({
        giftId: firstItem.giftId,
        giftName: firstItem.giftName,
        guestName,
        guestEmail,
        quantity: firstItem.quantity,
        items: normalizedItems,
        printedCard: {
          enabled: cardEnabled,
          signerName: cardEnabled ? String(printedCard?.signerName || guestName) : '',
          message: cardEnabled ? String(printedCard?.message || '') : '',
          fee: cardFee,
        },
        totalAmount,
        status: 'pending',
        paymentMethod: paymentMode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const payment = await createProviderPayment({
        orderId: orderRef.id,
        amount: totalAmount,
        description: `${normalizedItems.length} item(ns) - ${firstItem.giftName}`,
        customerName: guestName,
        customerEmail: guestEmail,
      });

      await orderRef.update({
        providerPaymentId: payment.externalPaymentId || null,
        paymentUrl: payment.paymentUrl || null,
        pixCode: payment.pixCode || null,
        qrCodeBase64: payment.qrCodeBase64 || null,
        providerPayload: payment.raw || null,
        updatedAt: new Date().toISOString(),
      });

      return res.json({
        orderId: orderRef.id,
        status: 'pending',
        paymentUrl: payment.paymentUrl || null,
        pixCode: payment.pixCode || null,
        qrCodeBase64: payment.qrCodeBase64 || null,
      });
    } catch (error) {
      console.error('Error creating payment:', error);
      return res.status(500).json({ error: 'Erro interno ao criar pagamento.' });
    }
  });

  app.get('/api/payments/status/:orderId', async (req, res) => {
    try {
      const orderId = req.params.orderId;
      if (!isNonEmptyString(orderId)) {
        return res.status(400).json({ error: 'OrderId inválido.' });
      }

      const orderDoc = await db.collection('orders').doc(orderId).get();
      if (!orderDoc.exists) {
        return res.status(404).json({ error: 'Pedido não encontrado.' });
      }

      const data = orderDoc.data()!;
      return res.json({
        orderId,
        status: sanitizeStatus(data.status),
        giftName: data.giftName,
        totalAmount: data.totalAmount,
        paymentUrl: data.paymentUrl || null,
        pixCode: data.pixCode || null,
        updatedAt: data.updatedAt || data.createdAt || null,
      });
    } catch (error) {
      console.error('Error fetching payment status:', error);
      return res.status(500).json({ error: 'Erro interno ao consultar pagamento.' });
    }
  });

  app.post('/api/payments/webhook', async (req, res) => {
    const rawBody = (req as express.Request & { rawBody?: string }).rawBody || JSON.stringify(req.body || {});
    const signature = req.headers['x-infinitepay-signature'] || req.headers['x-signature'];
    if (!verifyWebhookSignature(rawBody, signature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    try {
      const payload = req.body || {};
      const eventId = payload.eventId || payload.id || `${Date.now()}`;
      const status = sanitizeStatus(payload.status || payload.paymentStatus || payload.event);
      const externalReference =
        payload.orderId || payload.externalReference || payload.reference || payload.metadata?.orderId;
      const orderId = isNonEmptyString(externalReference) ? externalReference : '';
      if (!orderId) {
        return res.status(400).json({ error: 'Order reference ausente no webhook.' });
      }

      const orderRef = db.collection('orders').doc(orderId);
      await db.runTransaction(async (transaction) => {
        const orderDoc = await transaction.get(orderRef);
        if (!orderDoc.exists) {
          throw new Error('Order not found');
        }

        const orderData = orderDoc.data()!;
        const currentStatus = sanitizeStatus(orderData.status);
        const lastEventId = orderData.lastWebhookEventId;
        if (lastEventId && lastEventId === eventId) {
          return;
        }

        transaction.update(orderRef, {
          status,
          lastWebhookEventId: eventId,
          lastWebhookAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          webhookPayload: payload,
        });

        const shouldDeductStock = currentStatus !== 'paid' && status === 'paid';
        if (shouldDeductStock) {
          const items = Array.isArray(orderData.items)
            ? orderData.items
            : [{ giftId: orderData.giftId, quantity: orderData.quantity, managedByInventory: true }];

          for (const item of items) {
            if (!item?.managedByInventory) continue;
            if (!isNonEmptyString(item.giftId)) continue;
            const giftRef = db.collection('gifts').doc(item.giftId);
            const giftDoc = await transaction.get(giftRef);
            if (!giftDoc.exists) continue;

            const currentAvailable = Math.floor(parseNumber(giftDoc.data()!.availableQuantity));
            const orderedQty = Math.floor(parseNumber(item.quantity));
            transaction.update(giftRef, {
              availableQuantity: Math.max(0, currentAvailable - orderedQty),
            });
          }
        }
      });

      return res.json({ received: true, status: 'processed' });
    } catch (error) {
      if (error instanceof Error && error.message === 'Order not found') {
        return res.status(404).json({ error: 'Order not found' });
      }
      console.error('Webhook error:', error);
      return res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  app.post('/api/payments/mock/confirm/:orderId', async (req, res) => {
    if (paymentMode !== 'mock' && paymentMode !== 'pix_manual') {
      return res.status(403).json({ error: 'Endpoint disponível apenas em modo de teste.' });
    }

    try {
      const orderId = req.params.orderId;
      const orderRef = db.collection('orders').doc(orderId);

      await db.runTransaction(async (transaction) => {
        const orderDoc = await transaction.get(orderRef);
        if (!orderDoc.exists) {
          throw new Error('Order not found');
        }

        const orderData = orderDoc.data()!;
        if (orderData.status !== 'paid') {
          transaction.update(orderRef, {
            status: 'paid',
            updatedAt: new Date().toISOString(),
            paidAt: new Date().toISOString(),
          });

          const items = Array.isArray(orderData.items)
            ? orderData.items
            : [{ giftId: orderData.giftId, quantity: orderData.quantity, managedByInventory: true }];

          for (const item of items) {
            if (!item?.managedByInventory) continue;
            if (!isNonEmptyString(item.giftId)) continue;
            const giftRef = db.collection('gifts').doc(item.giftId);
            const giftDoc = await transaction.get(giftRef);
            if (!giftDoc.exists) continue;

            const currentAvailable = Math.floor(parseNumber(giftDoc.data()!.availableQuantity));
            const orderedQty = Math.floor(parseNumber(item.quantity));
            transaction.update(giftRef, {
              availableQuantity: Math.max(0, currentAvailable - orderedQty),
            });
          }
        }
      });

      return res.json({ ok: true });
    } catch (error) {
      if (error instanceof Error && error.message === 'Order not found') {
        return res.status(404).json({ error: 'Order not found' });
      }
      console.error('Mock confirm error:', error);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
