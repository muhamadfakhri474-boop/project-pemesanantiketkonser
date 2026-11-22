import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './config/db.js';
import adminAuthRoutes from './routes/admin/adminAuthRoutes.js';
import adminArtistRoutes from './routes/admin/artistRoutes.js';
import adminEventRoutes from './routes/admin/eventRoutes.js';
import adminTicketCategoryRoutes from './routes/admin/ticketCategoryRoutes.js';
import adminOrderRoutes from './routes/admin/orderRoutes.js';
import adminPaymentRoutes from './routes/admin/paymentRoutes.js';
import adminDashboardRoutes from './routes/admin/dashboardRoutes.js';
import customerAuthRoutes from './routes/customer/customerAuthRoutes.js';
import customerEventRoutes from './routes/customer/eventRoutes.js';
import customerOrderRoutes from './routes/customer/orderRoutes.js';
import customerPaymentRoutes from './routes/customer/paymentRoutes.js';
import customerProfileRoutes from './routes/customer/profileRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import seatRoutes from './routes/seatRoutes.js';

import http from 'http';
import { initRealtime } from './config/realtime.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions = {
  origin: (origin, callback) => {
    // Expo web dapat berjalan pada port 8081, 19006, atau 5173.
    // MOBILE_URL biasanya berisi deep-link (contoh: konserticket://),
    // bukan origin HTTP dari Expo web, jadi jangan gunakan itu sebagai satu-satunya URL.
    const allowedOrigins = [
      process.env.WEB_URL,
      process.env.MOBILE_URL,
      'http://localhost:5173',
      'http://localhost:8081',
      'http://localhost:19006',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:8081',
      'http://127.0.0.1:19006',
    ].filter(Boolean);

    // Port dev Vite bisa bergeser (5174, 5175, dst. saat port utama terpakai),
    // jadi izinkan origin localhost/127.0.0.1 pada port berapa pun.
    const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

    // Izinkan request tanpa origin (React Native, Postman, dan mobile apps).
    if (!origin || isLocalhost || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin ${origin} tidak diizinkan`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

app.use('/api/admin/auth',       adminAuthRoutes);
app.use('/api/admin/artists',    adminArtistRoutes);
app.use('/api/admin/events',     adminEventRoutes);
app.use('/api/admin/categories', adminTicketCategoryRoutes);
app.use('/api/admin/orders',     adminOrderRoutes);
app.use('/api/admin/payments',   adminPaymentRoutes);
app.use('/api/admin/dashboard',  adminDashboardRoutes);

app.use('/api/customer/auth',     customerAuthRoutes);
app.use('/api/customer/events',   customerEventRoutes);
app.use('/api/customer/orders',   customerOrderRoutes);
app.use('/api/customer/payments', customerPaymentRoutes);
app.use('/api/customer/profile',  customerProfileRoutes);


app.use('/api/payments', webhookRoutes);


app.use('/api/tickets', ticketRoutes);
app.use('/api', seatRoutes);

app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

app.get('/', (req, res) => {
  res.json({ message: 'Konser Ticket API is running' });
});

// ==============================
// 404 Handler
// ==============================
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} tidak ditemukan` });
});

// ==============================
// Global Error Handler
// ==============================
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Internal Server Error' });
});

// ==============================
// Start Server
// ==============================
const server = http.createServer(app);
initRealtime(server, corsOptions);

server.listen(PORT, async () => {
  try {
    await db.query('SELECT 1');
    console.log('Database connected successfully');
  } catch (err) {
    console.error('Database connection failed:', err.message);
  }
  console.log(`Server running on http://localhost:${PORT}`);
});
