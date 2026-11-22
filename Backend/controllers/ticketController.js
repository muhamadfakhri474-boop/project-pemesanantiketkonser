import db from '../config/db.js';
import QRCode from 'qrcode';

// GET /api/tickets/verify/:orderId  — public, bisa dibuka siapa saja yang scan QR
export const verifyTicket = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT o.id, o.ticket_token, o.payment_status, o.total_price, o.order_date,
             e.title AS event_title, e.event_date, e.event_time, e.venue, e.city, e.poster,
             u.name AS customer_name, u.email AS customer_email,
             a.name AS artist_name
      FROM orders o
      JOIN events e ON o.event_id = e.id
      JOIN users u ON o.user_id = u.id
      LEFT JOIN artists a ON e.artist_id = a.id
      WHERE o.id = ? AND o.ticket_token IS NOT NULL
    `, [req.params.orderId]);

    if (rows.length === 0) {
      return res.status(404).json({ valid: false, message: 'Tiket tidak ditemukan' });
    }

    const order = rows[0];

    if (order.payment_status !== 'paid') {
      return res.status(400).json({
        valid: false,
        message: 'Tiket belum dibayar atau tidak valid',
        status: order.payment_status
      });
    }

    // Ambil detail tiket
    const [items] = await db.query(`
      SELECT oi.quantity, oi.price, oi.subtotal, tc.name AS kategori
      FROM order_items oi
      JOIN ticket_categories tc ON oi.ticket_category_id = tc.id
      WHERE oi.order_id = ?
    `, [req.params.orderId]);

    res.json({
      valid: true,
      ticket_token: order.ticket_token,
      order_id: order.id,
      customer: {
        name: order.customer_name,
        email: order.customer_email
      },
      event: {
        title: order.event_title,
        artist: order.artist_name,
        date: order.event_date,
        time: order.event_time,
        venue: order.venue,
        city: order.city,
        poster: order.poster
      },
      tickets: items,
      total_price: order.total_price,
      order_date: order.order_date
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/customer/orders/:id/qrcode  — generate QR berisi URL verify
export const getOrderQRCode = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT o.id, o.ticket_token, o.payment_status, o.total_price, o.order_date,
             e.title AS event_title, e.event_date, e.event_time, e.venue, e.city,
             u.name AS customer_name
      FROM orders o
      JOIN events e ON o.event_id = e.id
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ? AND o.user_id = ?
    `, [req.params.id, req.user.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Order tidak ditemukan' });
    }

    const order = rows[0];

    if (order.payment_status !== 'paid') {
      return res.status(400).json({
        message: 'QR Code hanya tersedia untuk order yang sudah dibayar',
        payment_status: order.payment_status
      });
    }

    const [items] = await db.query(`
      SELECT oi.quantity, tc.name AS kategori, oi.subtotal
      FROM order_items oi
      JOIN ticket_categories tc ON oi.ticket_category_id = tc.id
      WHERE oi.order_id = ?
    `, [req.params.id]);

    // QR berisi URL verify — bisa discan siapapun
    const verifyUrl = `${process.env.BASE_URL || 'http://192.168.1.22:3000'}/api/tickets/verify/${order.id}`;

    const qrImage = await QRCode.toDataURL(verifyUrl, {
      errorCorrectionLevel: 'H',
      width: 300,
      margin: 2
    });

    res.json({
      order_id: order.id,
      event_title: order.event_title,
      event_date: order.event_date,
      event_time: order.event_time,
      venue: order.venue,
      city: order.city,
      customer_name: order.customer_name,
      items,
      total_price: order.total_price,
      qr_code: qrImage,
      verify_url: verifyUrl
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
