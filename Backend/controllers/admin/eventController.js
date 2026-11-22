import db from '../../config/db.js';
import fs from 'fs';

function parseArtistIds(body) {
  let ids = [];
  if (body.artist_ids) {
    if (Array.isArray(body.artist_ids)) {
      ids = body.artist_ids;
    } else if (typeof body.artist_ids === 'string') {
      try {
        const parsed = JSON.parse(body.artist_ids);
        if (Array.isArray(parsed)) ids = parsed;
        else ids = [parsed];
      } catch {
        ids = body.artist_ids.split(',').map((s) => s.trim());
      }
    }
  } else if (body['artist_ids[]']) {
    ids = Array.isArray(body['artist_ids[]']) ? body['artist_ids[]'] : [body['artist_ids[]']];
  } else if (body.artist_id) {
    ids = [body.artist_id];
  }
  return [...new Set(ids.map((v) => Number(v)).filter((n) => Number.isInteger(n) && n > 0))];
}

// GET /api/admin/events
export const getAllEvents = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT e.id, e.title, e.description, e.venue, e.city, e.genre,
             e.event_date, e.event_time, e.poster, e.status, e.created_at,
             e.artist_id
      FROM events e
      ORDER BY e.event_date DESC
    `);

    if (rows.length === 0) return res.json([]);

    const eventIds = rows.map((r) => r.id);

    // Ambil seluruh artis yang berpartisipasi di konser-konser ini
    const [artistRows] = await db.query(
      `SELECT ea.event_id, a.id AS artist_id, a.name AS artist_name, a.photo AS artist_photo, a.genre AS artist_genre
       FROM event_artists ea
       JOIN artists a ON ea.artist_id = a.id
       WHERE ea.event_id IN (?)
       ORDER BY ea.id ASC`,
      [eventIds]
    );

    const artistsByEvent = {};
    for (const ar of artistRows) {
      if (!artistsByEvent[ar.event_id]) artistsByEvent[ar.event_id] = [];
      artistsByEvent[ar.event_id].push({
        id: ar.artist_id,
        name: ar.artist_name,
        photo: ar.artist_photo,
        genre: ar.artist_genre,
      });
    }

    // Fallback jika event_artists belum terisi tetapi events.artist_id ada
    const fallbackIds = rows
      .filter((r) => (!artistsByEvent[r.id] || artistsByEvent[r.id].length === 0) && r.artist_id)
      .map((r) => r.artist_id);

    let fallbackArtists = {};
    if (fallbackIds.length > 0) {
      const [faRows] = await db.query(
        'SELECT id, name, photo, genre FROM artists WHERE id IN (?)',
        [fallbackIds]
      );
      for (const fa of faRows) fallbackArtists[fa.id] = fa;
    }

    const result = rows.map((r) => {
      let evArtists = artistsByEvent[r.id] || [];
      if (evArtists.length === 0 && r.artist_id && fallbackArtists[r.artist_id]) {
        const fa = fallbackArtists[r.artist_id];
        evArtists = [{ id: fa.id, name: fa.name, photo: fa.photo, genre: fa.genre }];
      }

      const artistNames = evArtists.map((a) => a.name).join(', ');
      const artistIds = evArtists.map((a) => a.id);
      const primaryArtist = evArtists[0] || null;

      return {
        ...r,
        artist_id: primaryArtist ? primaryArtist.id : r.artist_id,
        artist_name: artistNames || '-',
        artist_photo: primaryArtist ? primaryArtist.photo : null,
        artist_ids: artistIds,
        artists: evArtists,
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/admin/events/:id
export const getEventById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM events WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Event tidak ditemukan' });

    const event = rows[0];

    const [artistRows] = await db.query(
      `SELECT a.id, a.name, a.photo, a.genre, a.description
       FROM event_artists ea
       JOIN artists a ON ea.artist_id = a.id
       WHERE ea.event_id = ?
       ORDER BY ea.id ASC`,
      [req.params.id]
    );

    let artists = artistRows;
    if (artists.length === 0 && event.artist_id) {
      const [faRows] = await db.query(
        'SELECT id, name, photo, genre, description FROM artists WHERE id = ?',
        [event.artist_id]
      );
      if (faRows.length > 0) artists = faRows;
    }

    const artistNames = artists.map((a) => a.name).join(', ');
    const artistIds = artists.map((a) => a.id);
    const primaryArtist = artists[0] || null;

    // Ambil ticket categories milik event ini
    const [categories] = await db.query(
      'SELECT * FROM ticket_categories WHERE event_id = ?',
      [req.params.id]
    );

    res.json({
      ...event,
      artist_id: primaryArtist ? primaryArtist.id : event.artist_id,
      artist_name: artistNames || '-',
      artist_photo: primaryArtist ? primaryArtist.photo : null,
      artist_ids: artistIds,
      artists,
      ticket_categories: categories
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/admin/events
export const createEvent = async (req, res) => {
  const { title, description, venue, city, genre, event_date, event_time, status } = req.body;
  const artistIds = parseArtistIds(req.body);
  const poster = req.file ? req.file.path.replace(/\\/g, '/') : null;

  if (artistIds.length === 0 || !title || !venue || !city || !event_date || !event_time) {
    return res.status(400).json({ message: 'Semua field wajib diisi (pilih minimal satu artis) kecuali deskripsi dan poster' });
  }

  const primaryArtistId = artistIds[0];
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO events (artist_id, title, description, venue, city, genre, event_date, event_time, poster, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [primaryArtistId, title, description || null, venue, city, genre || null, event_date, event_time, poster, status || 'open']
    );

    const eventId = result.insertId;

    if (artistIds.length > 0) {
      const values = artistIds.map((aid) => [eventId, aid]);
      await conn.query('INSERT IGNORE INTO event_artists (event_id, artist_id) VALUES ?', [values]);
    }

    await conn.commit();
    conn.release();

    res.status(201).json({ message: 'Event berhasil ditambahkan', eventId });
  } catch (err) {
    try { await conn.rollback(); } catch {}
    conn.release();
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/admin/events/:id
export const updateEvent = async (req, res) => {
  const { title, description, venue, city, genre, event_date, event_time, status } = req.body;
  const artistIds = parseArtistIds(req.body);

  const conn = await db.getConnection();
  try {
    const [existing] = await conn.query('SELECT * FROM events WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      conn.release();
      return res.status(404).json({ message: 'Event tidak ditemukan' });
    }

    let poster = existing[0].poster;
    if (req.file) {
      if (poster && fs.existsSync(poster)) fs.unlinkSync(poster);
      poster = req.file.path.replace(/\\/g, '/');
    }

    const e = existing[0];
    const primaryArtistId = artistIds.length > 0 ? artistIds[0] : e.artist_id;

    await conn.beginTransaction();

    await conn.query(
      `UPDATE events SET artist_id=?, title=?, description=?, venue=?, city=?, genre=?,
       event_date=?, event_time=?, poster=?, status=? WHERE id=?`,
      [
        primaryArtistId,
        title || e.title,
        description !== undefined ? description : e.description,
        venue || e.venue,
        city || e.city,
        genre !== undefined ? genre : e.genre,
        event_date || e.event_date,
        event_time || e.event_time,
        poster,
        status || e.status,
        req.params.id
      ]
    );

    if (artistIds.length > 0) {
      await conn.query('DELETE FROM event_artists WHERE event_id = ?', [req.params.id]);
      const values = artistIds.map((aid) => [req.params.id, aid]);
      await conn.query('INSERT IGNORE INTO event_artists (event_id, artist_id) VALUES ?', [values]);
    }

    await conn.commit();
    conn.release();

    res.json({ message: 'Event berhasil diperbarui' });
  } catch (err) {
    try { await conn.rollback(); } catch {}
    conn.release();
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE /api/admin/events/:id
// Menghapus konser beserta data pesanan terkait agar tidak gagal karena foreign key.
export const deleteEvent = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const [existing] = await conn.query('SELECT * FROM events WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      conn.release();
      return res.status(404).json({ message: 'Event tidak ditemukan' });
    }

    await conn.beginTransaction();

    await conn.query(
      'DELETE FROM payments WHERE order_id IN (SELECT id FROM orders WHERE event_id = ?)',
      [req.params.id]
    );
    await conn.query(
      'DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE event_id = ?)',
      [req.params.id]
    );
    await conn.query(
      'DELETE FROM order_seats WHERE order_id IN (SELECT id FROM orders WHERE event_id = ?)',
      [req.params.id]
    );
    await conn.query('DELETE FROM orders WHERE event_id = ?', [req.params.id]);
    await conn.query('DELETE FROM event_artists WHERE event_id = ?', [req.params.id]);
    await conn.query('DELETE FROM events WHERE id = ?', [req.params.id]);

    await conn.commit();
    conn.release();

    if (existing[0].poster && fs.existsSync(existing[0].poster)) {
      try { fs.unlinkSync(existing[0].poster); } catch { /* noop */ }
    }

    res.json({ message: 'Event berhasil dihapus' });
  } catch (err) {
    try { await conn.rollback(); } catch { /* noop */ }
    conn.release();
    res.status(500).json({ message: 'Gagal menghapus event', error: err.message });
  }
};

// PATCH /api/admin/events/:id/status
export const updateEventStatus = async (req, res) => {
  const { status } = req.body;
  if (!['open', 'closed'].includes(status)) {
    return res.status(400).json({ message: 'Status harus open atau closed' });
  }

  try {
    const [existing] = await db.query('SELECT id FROM events WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ message: 'Event tidak ditemukan' });

    await db.query('UPDATE events SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: `Status event diubah menjadi ${status}` });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
