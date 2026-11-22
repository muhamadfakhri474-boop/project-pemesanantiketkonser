import db from '../../config/db.js';
import { emitRealtime } from '../../config/realtime.js';

// GET /api/customer/orders  — riwayat order milik customer
export const getMyOrders = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT o.id, o.total_price, o.payment_status, o.order_date,
             e.title AS event_title, e.event_date, e.venue, e.city, e.poster
      FROM orders o
      JOIN events e ON o.event_id = e.id
      WHERE o.user_id = ?
      ORDER BY o.order_date DESC
    `, [req.user.id]);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/customer/orders/:id  — detail order milik customer
export const getMyOrderById = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT o.*, e.title AS event_title, e.event_date, e.venue, e.city, e.poster
      FROM orders o
      JOIN events e ON o.event_id = e.id
      WHERE o.id = ? AND o.user_id = ?
    `, [req.params.id, req.user.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Order tidak ditemukan' });
    }

    const [items] = await db.query(`
      SELECT oi.quantity, oi.price, oi.subtotal, tc.name AS category_name
      FROM order_items oi
      JOIN ticket_categories tc ON oi.ticket_category_id = tc.id
      WHERE oi.order_id = ?
    `, [req.params.id]);
    const [seats] = await db.query(`
      SELECT os.event_seat_id, os.price, es.seat_label, es.section_name, es.row_label, es.seat_number
      FROM order_seats os JOIN event_seats es ON es.id = os.event_seat_id
      WHERE os.order_id = ?
    `, [req.params.id]);

    const [payment] = await db.query(
      'SELECT id, payment_method, payment_proof, status, verified_at FROM payments WHERE order_id = ?',
      [req.params.id]
    );

    res.json({ ...rows[0], items, seats, payment: payment[0] || null });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/customer/orders  — buat order baru
export const createOrder = async (req, res) => {
  const { event_id, items, seat_ids = [] } = req.body;
  // items: [{ ticket_category_id, quantity }]; seat_ids: kursi individual opsional

  if (!event_id || !items || !Array.isArray(items) || items.length === 0 || !Array.isArray(seat_ids)) {
    return res.status(400).json({ message: 'event_id dan items wajib diisi' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    if (items.some(item => !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1) || new Set(items.map(item => Number(item.ticket_category_id))).size !== items.length || seat_ids.some(id => !Number.isInteger(Number(id))) || new Set(seat_ids.map(Number)).size !== seat_ids.length) {
      await conn.rollback();
      return res.status(400).json({ message: 'Item atau kursi tidak valid/duplikat' });
    }
    if (items.reduce((sum, item) => sum + Number(item.quantity), 0) > 10 || seat_ids.length > 10) {
      await conn.rollback();
      return res.status(400).json({ message: 'Maksimal 10 tiket per order' });
    }

    // Cek event masih open
    const [events] = await conn.query(
      'SELECT id, payment_deadline_minutes FROM events WHERE id = ? AND status = ? AND TIMESTAMP(event_date, event_time) > NOW()',
      [event_id, 'open']
    );
    if (events.length === 0) {
      await conn.rollback();
      return res.status(400).json({ message: 'Event tidak tersedia atau sudah ditutup' });
    }

    const deadlineMinutes = Number(events[0].payment_deadline_minutes) || 30;
    let totalPrice = 0;
    const orderItems = [];

    for (const item of items) {
      const { ticket_category_id, quantity } = item;

      if (!ticket_category_id || !quantity || quantity < 1) {
        await conn.rollback();
        return res.status(400).json({ message: 'ticket_category_id dan quantity wajib diisi' });
      }

      const [categories] = await conn.query(
        'SELECT * FROM ticket_categories WHERE id = ? AND event_id = ? FOR UPDATE',
        [ticket_category_id, event_id]
      );

      if (categories.length === 0) {
        await conn.rollback();
        return res.status(404).json({ message: `Kategori tiket ${ticket_category_id} tidak ditemukan` });
      }

      const cat = categories[0];
      if (cat.remaining_quota < quantity) {
        await conn.rollback();
        return res.status(400).json({ message: `Kuota tidak cukup untuk kategori ${cat.name}` });
      }

      const subtotal = cat.price * quantity;
      totalPrice += subtotal;
      orderItems.push({ ticket_category_id, quantity, price: cat.price, subtotal });

      // Pada mode seat, ketersediaan dikontrol oleh event_seats agar tidak dihitung dua kali.
      if (seat_ids.length === 0) {
        await conn.query(
          'UPDATE ticket_categories SET remaining_quota = remaining_quota - ? WHERE id = ?',
          [quantity, ticket_category_id]
        );
      }
    }

    let selectedSeats = [];
    if (seat_ids.length) {
      const [seatRows] = await conn.query(`SELECT * FROM event_seats WHERE event_id = ? AND id IN (?) FOR UPDATE`, [event_id, seat_ids]);
      if (seatRows.length !== seat_ids.length || seatRows.some(seat => !['available'].includes(seat.status))) {
        await conn.rollback();
        return res.status(409).json({ message: 'Salah satu kursi sudah tidak tersedia' });
      }
      selectedSeats = seatRows;
    }

    // Buat order
    const [orderResult] = await conn.query(
      `INSERT INTO orders (user_id, event_id, total_price, payment_status, payment_deadline, ticket_token)
       VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ${deadlineMinutes} MINUTE), UUID())`,
      [req.user.id, event_id, totalPrice, 'pending']
    );

    const orderId = orderResult.insertId;

    // Simpan order items
    for (const item of orderItems) {
      await conn.query(
        'INSERT INTO order_items (order_id, ticket_category_id, quantity, price, subtotal) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.ticket_category_id, item.quantity, item.price, item.subtotal]
      );
    }

    for (const seat of selectedSeats) {
      await conn.query('INSERT INTO order_seats (order_id, event_seat_id, price) VALUES (?, ?, ?)', [orderId, seat.id, seat.price]);
      await conn.query("UPDATE event_seats SET status = 'held', held_until = DATE_ADD(NOW(), INTERVAL 30 MINUTE) WHERE id = ?", [seat.id]);
    }

    await conn.commit();

    emitRealtime('orders:changed', { action: 'create', orderId, eventId: event_id });
    emitRealtime('categories:changed', { action: 'quota_updated', eventId: event_id });
    emitRealtime('dashboard:changed', { action: 'order_created' });

    res.status(201).json({
      message: 'Order berhasil dibuat, silakan lakukan pembayaran',
      order_id: orderId,
      total_price: totalPrice
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    conn.release();
  }
};

// DELETE /api/customer/orders/:id  — cancel order (hanya jika masih pending)
export const cancelOrder = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Order tidak ditemukan' });
    }

    if (rows[0].payment_status !== 'pending') {
      await conn.rollback();
      return res.status(400).json({ message: 'Hanya order dengan status pending yang bisa dibatalkan' });
    }

    // Release individual seats held by this order as well as category quota.
    await conn.query(
      "UPDATE event_seats es JOIN order_seats os ON os.event_seat_id = es.id SET es.status = 'available', es.held_until = NULL WHERE os.order_id = ? AND es.status = 'held'",
      [req.params.id]
    );

    // Kembalikan kuota hanya untuk order non-seat. Seat order tidak pernah
    // mengurangi remaining_quota saat dibuat, sehingga tidak boleh ditambah lagi.
    const [orderSeats] = await conn.query(
      'SELECT id FROM order_seats WHERE order_id = ? LIMIT 1',
      [req.params.id]
    );
    if (orderSeats.length === 0) {
      const [items] = await conn.query(
        'SELECT ticket_category_id, quantity FROM order_items WHERE order_id = ?',
        [req.params.id]
      );
      for (const item of items) {
        await conn.query(
          'UPDATE ticket_categories SET remaining_quota = LEAST(quota, remaining_quota + ?) WHERE id = ?',
          [item.quantity, item.ticket_category_id]
        );
      }
    }

    await conn.query(
      'UPDATE orders SET payment_status = ? WHERE id = ?',
      ['cancelled', req.params.id]
    );

    await conn.commit();

    emitRealtime('orders:changed', { action: 'cancel', orderId: req.params.id });
    emitRealtime('categories:changed', { action: 'quota_restored' });
    emitRealtime('dashboard:changed', { action: 'order_cancelled' });

    res.json({ message: 'Order berhasil dibatalkan' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    conn.release();
  }
};
