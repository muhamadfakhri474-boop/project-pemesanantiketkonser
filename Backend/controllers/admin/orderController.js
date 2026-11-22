import db from '../../config/db.js';

// GET /api/admin/orders
export const getAllOrders = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT o.*, u.name AS customer_name, u.email AS customer_email, e.title AS event_title,
        (SELECT GROUP_CONCAT(DISTINCT tc.name ORDER BY tc.name SEPARATOR ', ')
           FROM order_items oi
           JOIN ticket_categories tc ON oi.ticket_category_id = tc.id
          WHERE oi.order_id = o.id) AS category,
        (SELECT COALESCE(SUM(oi.quantity), 0)
           FROM order_items oi
          WHERE oi.order_id = o.id) AS qty
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN events e ON o.event_id = e.id
      ORDER BY o.order_date DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/admin/orders/:id
export const getOrderById = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT o.*, u.name AS customer_name, u.email AS customer_email,
             e.title AS event_title, e.venue, e.city, e.event_date,
             p.payment_method, p.transaction_id, p.status AS payment_verify_status,
             p.verified_at, p.payment_proof
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN events e ON o.event_id = e.id
      LEFT JOIN payments p ON p.id = (
        SELECT MAX(p2.id) FROM payments p2 WHERE p2.order_id = o.id
      )
      WHERE o.id = ?
    `, [req.params.id]);

    if (rows.length === 0) return res.status(404).json({ message: 'Order tidak ditemukan' });

    const [items] = await db.query(`
      SELECT oi.*, tc.name AS category_name
      FROM order_items oi
      JOIN ticket_categories tc ON oi.ticket_category_id = tc.id
      WHERE oi.order_id = ?
    `, [req.params.id]);

    res.json({ ...rows[0], items });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PATCH /api/admin/orders/:id/status
export const updateOrderStatus = async (req, res) => {
  const { payment_status } = req.body;
  const validStatus = ['pending', 'paid', 'rejected', 'cancelled'];

  if (!validStatus.includes(payment_status)) {
    return res.status(400).json({ message: 'Status tidak valid' });
  }

  try {
    const [existing] = await db.query('SELECT id FROM orders WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ message: 'Order tidak ditemukan' });

    await db.query('UPDATE orders SET payment_status = ? WHERE id = ?', [payment_status, req.params.id]);
    res.json({ message: `Status order diubah menjadi ${payment_status}` });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
