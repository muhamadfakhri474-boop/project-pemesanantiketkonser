import db from '../../config/db.js';
import fs from 'fs';

const removeFile = (filePath) => {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // abaikan kegagalan hapus file; data tetap dihapus
  }
};

// GET /api/admin/artists
export const getAllArtists = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM artists ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/admin/artists/:id
export const getArtistById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM artists WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Artist tidak ditemukan' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/admin/artists
export const createArtist = async (req, res) => {
  const { name, description, genre } = req.body;
  const photo = req.file ? req.file.path.replace(/\\/g, '/') : null;

  if (!name) return res.status(400).json({ message: 'Nama artist wajib diisi' });

  try {
    const [result] = await db.query(
      'INSERT INTO artists (name, description, genre, photo) VALUES (?, ?, ?, ?)',
      [name, description || null, genre || null, photo]
    );
    res.status(201).json({ message: 'Artist berhasil ditambahkan', artistId: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/admin/artists/:id
export const updateArtist = async (req, res) => {
  const { name, description, genre } = req.body;

  try {
    const [existing] = await db.query('SELECT * FROM artists WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ message: 'Artist tidak ditemukan' });

    let photo = existing[0].photo;
    if (req.file) {
      removeFile(photo);
      photo = req.file.path.replace(/\\/g, '/');
    }

    await db.query(
      'UPDATE artists SET name = ?, description = ?, genre = ?, photo = ? WHERE id = ?',
      [
        name || existing[0].name,
        description ?? existing[0].description,
        genre !== undefined ? genre : existing[0].genre,
        photo,
        req.params.id,
      ]
    );

    res.json({ message: 'Artist berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE /api/admin/artists/:id
// Menghapus artist beserta konser dan data pesanan yang bergantung padanya,
// supaya proses hapus tidak gagal karena foreign key.
export const deleteArtist = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const [existing] = await conn.query('SELECT * FROM artists WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      conn.release();
      return res.status(404).json({ message: 'Artist tidak ditemukan' });
    }

    await conn.beginTransaction();

    // Hapus relasi artis ini dari event_artists
    await conn.query('DELETE FROM event_artists WHERE artist_id = ?', [req.params.id]);

    // Cari event yang e.artist_id = artis ini
    const [linkedEvents] = await conn.query('SELECT id, poster FROM events WHERE artist_id = ?', [req.params.id]);

    const eventsToDelete = [];
    for (const ev of linkedEvents) {
      // Cek apakah event ini masih memiliki artis lain di event_artists
      const [remaining] = await conn.query(
        'SELECT artist_id FROM event_artists WHERE event_id = ? ORDER BY id ASC LIMIT 1',
        [ev.id]
      );
      if (remaining.length > 0) {
        // Alihkan primary artist ke artis berikutnya
        await conn.query('UPDATE events SET artist_id = ? WHERE id = ?', [remaining[0].artist_id, ev.id]);
      } else {
        // Event tidak memiliki artis lain, tandai untuk dihapus
        eventsToDelete.push(ev);
      }
    }

    const eventIds = eventsToDelete.map((e) => e.id);
    if (eventIds.length > 0) {
      const placeholders = eventIds.map(() => '?').join(', ');
      await conn.query(
        `DELETE FROM payments WHERE order_id IN (SELECT id FROM orders WHERE event_id IN (${placeholders}))`,
        eventIds
      );
      await conn.query(
        `DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE event_id IN (${placeholders}))`,
        eventIds
      );
      await conn.query(
        `DELETE FROM order_seats WHERE order_id IN (SELECT id FROM orders WHERE event_id IN (${placeholders}))`,
        eventIds
      );
      await conn.query(`DELETE FROM orders WHERE event_id IN (${placeholders})`, eventIds);
      await conn.query(`DELETE FROM event_artists WHERE event_id IN (${placeholders})`, eventIds);
      await conn.query(`DELETE FROM events WHERE id IN (${placeholders})`, eventIds);
    }

    // events -> ticket_categories & event_seats terhapus otomatis (ON DELETE CASCADE)
    await conn.query('DELETE FROM artists WHERE id = ?', [req.params.id]);

    await conn.commit();
    conn.release();

    removeFile(existing[0].photo);
    eventsToDelete.forEach((e) => removeFile(e.poster));

    res.json({ message: 'Artist berhasil dihapus' });
  } catch (err) {
    try { await conn.rollback(); } catch { /* noop */ }
    conn.release();
    res.status(500).json({ message: 'Gagal menghapus artist', error: err.message });
  }
};
