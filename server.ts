import express from 'express';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import axios from 'axios';
import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'firebase-applet-config.json'), 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

// Use the specific database ID if provided
const db = firebaseConfig.firestoreDatabaseId 
  ? admin.firestore(firebaseConfig.firestoreDatabaseId)
  : admin.firestore();

// Seed initial data if needed
async function seedDatabase() {
  try {
    const weddingRef = db.collection('wedding').doc('info');
    const doc = await weddingRef.get();
    if (!doc.exists || doc.data()?.coupleNames === 'Maria & Lucas') {
      console.log('Seeding/Updating wedding info to Bruna e Leonardo...');
      await weddingRef.set({
        coupleNames: 'Bruna e Leonardo',
        weddingDate: '2026-11-07T18:00:00',
        story: 'Nossa história começou com um encontro inesperado e se transformou no amor de nossas vidas. Estamos ansiosos para celebrar este novo capítulo com vocês!',
        locationName: 'Espaço das Águas',
        locationAddress: 'Rua das Flores, 123 - São Paulo, SP',
        locationMapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.1975!2d-46.658!3d-23.563!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjPCsDMzJzQ2LjgiUyA0NsKwMzknMjguOCJX!5e0!3m2!1spt-BR!2sbr!4v1620000000000!5m2!1spt-BR!2sbr',
        dressCode: 'Passeio Completo',
        homeImageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80'
      }, { merge: true });
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
  app.use(express.json());

  // API: Create Payment Order
  app.post('/api/payments/create', async (req, res) => {
    const { giftId, quantity, guestEmail, guestName } = req.body;

    try {
      // 1. Get Gift details
      const giftDoc = await db.collection('gifts').doc(giftId).get();
      if (!giftDoc.exists) {
        return res.status(404).json({ error: 'Gift not found' });
      }
      const giftData = giftDoc.data()!;
      const totalAmount = giftData.price * quantity;

      // 2. Create Order in pending state
      const orderRef = await db.collection('orders').add({
        giftId,
        giftName: giftData.name,
        guestName,
        guestEmail,
        quantity,
        totalAmount,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      // 3. Integrate with Infinite Pay (Simulated for now)
      // In a real scenario, you'd call Infinite Pay API here
      // const response = await axios.post('https://api.infinitepay.io/v1/payments', { ... });
      
      // For demo purposes, we'll return a mock payment URL
      const mockPaymentUrl = `https://infinitepay.io/pay/mock-${orderRef.id}`;
      
      res.json({ 
        orderId: orderRef.id, 
        paymentUrl: mockPaymentUrl 
      });
    } catch (error) {
      console.error('Error creating payment:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // API: Webhook for Infinite Pay
  app.post('/api/payments/webhook', async (req, res) => {
    const { orderId, status } = req.body; // Adjust based on actual Infinite Pay webhook schema

    try {
      if (status === 'paid') {
        const orderRef = db.collection('orders').doc(orderId);
        const orderDoc = await orderRef.get();
        
        if (orderDoc.exists) {
          const orderData = orderDoc.data()!;
          
          // Update order status
          await orderRef.update({ status: 'paid' });

          // Update gift inventory
          const giftRef = db.collection('gifts').doc(orderData.giftId);
          await db.runTransaction(async (transaction) => {
            const giftDoc = await transaction.get(giftRef);
            if (giftDoc.exists) {
              const currentAvailable = giftDoc.data()!.availableQuantity;
              transaction.update(giftRef, {
                availableQuantity: Math.max(0, currentAvailable - orderData.quantity)
              });
            }
          });
        }
      }
      res.json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false // Explicitly disable HMR to avoid port conflicts
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
