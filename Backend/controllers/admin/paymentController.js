import db from '../../config/db.js';
import { emitRealtime } from '../../config/realtime.js';

// GET /api/admin/payments
export const getAllPayments = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.id, p.order_id, p.payment_method, p.transaction_id,
             p.transaction_status, p.payment_proof, p.status, p.verified_at,
             o.total_price, o.payment_status AS order_status, o.order_date,
             u.name AS customer_name, u.email AS customer_email,
             e.title AS event_title
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      JOIN users u ON o.user_id = u.id
      JOIN events e ON o.event_id = e.id
      ORDER BY p.id DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PATCH /api/admin/payments/:id/verify
// Menandai pembayaran terverifikasi dan order menjadi paid.
export const verifyPayment = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const [rows] = await conn.query('SELECT * FROM payments WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      conn.release();
      return res.status(404).json({ message: 'Pembayaran tidak ditemukan' });
    }

    await conn.beginTransaction();
    await conn.query(
      `UPDATE payments
       SET status = 'verified', verified_at = NOW(), verified_by = ?, transaction_status = 'settlement'
       WHERE id = ?`,
      [req.user?.id ?? null, req.params.id]
    );
    await conn.query(
      `UPDATE orders SET payment_status = 'paid', quota_released_at = NULL WHERE id = ?`,
      [rows[0].order_id]
    );
    await conn.commit();
    conn.release();

    emitRealtime('payments:changed', { action: 'verify', paymentId: req.params.id });
    emitRealtime('orders:changed', { action: 'paid', orderId: rows[0].order_id });
    emitRealtime('dashboard:changed', { action: 'payment_verified' });

    res.json({ message: 'Pembayaran berhasil diverifikasi' });
  } catch (err) {
    try { await conn.rollback(); } catch { /* noop */ }
    conn.release();
    res.status(500).json({ message: 'Gagal memverifikasi pembayaran', error: err.message });
  }
};

// PATCH /api/admin/payments/:id/reject
// Menolak pembayaran, mengembalikan kuota tiket, dan melepas kursi yang di-hold.
export const rejectPayment = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const [rows] = await conn.query('SELECT * FROM payments WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      conn.release();
      return res.status(404).json({ message: 'Pembayaran tidak ditemukan' });
    }

    const orderId = rows[0].order_id;

    await conn.beginTransaction();

    const [orderRows] = await conn.query('SELECT payment_status FROM orders WHERE id = ?', [orderId]);
    const alreadyRejected = orderRows[0]?.payment_status === 'rejected';

    if (!alreadyRejected) {
      const [items] = await conn.query(
        'SELECT ticket_category_id, quantity FROM order_items WHERE order_id = ?',
        [orderId]
      );
      for (const item of items) {
        await conn.query(
          `UPDATE ticket_categories
           SET remaining_quota = LEAST(quota, remaining_quota + ?)
           WHERE id = ?`,
          [item.quantity, item.ticket_category_id]
        );
      }

      await conn.query(
        `UPDATE event_seats es
         JOIN order_seats os ON os.event_seat_id = es.id
         SET es.status = 'available', es.held_until = NULL
         WHERE os.order_id = ?`,
        [orderId]
      );
    }

    await conn.query(
      `UPDATE payments
       SET status = 'rejected', verified_at = NOW(), verified_by = ?, transaction_status = 'deny'
       WHERE id = ?`,
      [req.user?.id ?? null, req.params.id]
    );
    await conn.query(
      `UPDATE orders SET payment_status = 'rejected', quota_released_at = NOW() WHERE id = ?`,
      [orderId]
    );

    await conn.commit();
    conn.release();

    emitRealtime('payments:changed', { action: 'reject', paymentId: req.params.id });
    emitRealtime('orders:changed', { action: 'rejected', orderId });
    emitRealtime('categories:changed', { action: 'quota_restored' });
    emitRealtime('dashboard:changed', { action: 'payment_rejected' });

    res.json({ message: 'Pembayaran berhasil ditolak' });
  } catch (err) {
    try { await conn.rollback(); } catch { /* noop */ }
    conn.release();
    res.status(500).json({ message: 'Gagal menolak pembayaran', error: err.message });
  }
};
export const getPaymentById = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.id, p.order_id, p.payment_method, p.transaction_id,
             p.transaction_status, p.status, p.verified_at,
             o.total_price, o.payment_status AS order_status, o.order_date,
             u.name AS customer_name, u.email AS customer_email,
             e.title AS event_title, e.event_date, e.venue
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      JOIN users u ON o.user_id = u.id
      JOIN events e ON o.event_id = e.id
      WHERE p.id = ?
    `, [req.params.id]);

    if (rows.length === 0) return res.status(404).json({ message: 'Payment tidak ditemukan' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
