import db from '../../config/db.js';

// GET /api/admin/events/:eventId/categories
export const getCategoriesByEvent = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM ticket_categories WHERE event_id = ?',
      [req.params.eventId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/admin/events/:eventId/categories
export const createCategory = async (req, res) => {
  const { name, benefits, price, quota } = req.body;

  if (!name || !price || !quota) {
    return res.status(400).json({ message: 'Name, price, dan quota wajib diisi' });
  }

  try {
    const [event] = await db.query('SELECT id FROM events WHERE id = ?', [req.params.eventId]);
    if (event.length === 0) return res.status(404).json({ message: 'Event tidak ditemukan' });

    const [result] = await db.query(
      `INSERT INTO ticket_categories (event_id, name, benefits, price, quota, remaining_quota)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.params.eventId, name, benefits || null, price, quota, quota]
    );

    res.status(201).json({ message: 'Kategori tiket berhasil ditambahkan', categoryId: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Nama kategori tersebut sudah ada pada konser ini' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/admin/categories/:id
export const updateCategory = async (req, res) => {
  const { name, benefits, price, quota } = req.body;

  try {
    const [existing] = await db.query('SELECT * FROM ticket_categories WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ message: 'Kategori tidak ditemukan' });

    const cat = existing[0];

    const soldQty = cat.quota - cat.remaining_quota;
    const newQuota = quota ? parseInt(quota) : cat.quota;
    const newRemaining = newQuota - soldQty;

    if (newRemaining < 0) {
      return res.status(400).json({ message: 'Quota baru lebih kecil dari tiket yang sudah terjual' });
    }

    await db.query(
      'UPDATE ticket_categories SET name=?, benefits=?, price=?, quota=?, remaining_quota=? WHERE id=?',
      [name || cat.name, benefits ?? cat.benefits, price || cat.price, newQuota, newRemaining, req.params.id]
    );

    res.json({ message: 'Kategori tiket berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE /api/admin/categories/:id
export const deleteCategory = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const [existing] = await conn.query('SELECT id FROM ticket_categories WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      conn.release();
      return res.status(404).json({ message: 'Kategori tidak ditemukan' });
    }

    const [used] = await conn.query(
      'SELECT COUNT(*) AS total FROM order_items WHERE ticket_category_id = ?',
      [req.params.id]
    );
    if (used[0].total > 0) {
      conn.release();
      return res.status(409).json({
        message: 'Kategori ini sudah memiliki pesanan sehingga tidak dapat dihapus',
      });
    }

    await conn.beginTransaction();
    // Kursi individual yang dibuat untuk kategori ini ikut dihapus.
    await conn.query('DELETE FROM event_seats WHERE ticket_category_id = ?', [req.params.id]);
    await conn.query('DELETE FROM ticket_categories WHERE id = ?', [req.params.id]);
    await conn.commit();
    conn.release();

    res.json({ message: 'Kategori tiket berhasil dihapus' });
  } catch (err) {
    try { await conn.rollback(); } catch { /* noop */ }
    conn.release();
    res.status(500).json({ message: 'Gagal menghapus kategori', error: err.message });
  }
};
