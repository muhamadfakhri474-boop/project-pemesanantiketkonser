import db from '../../config/db.js';

// GET /api/customer/events  — list semua event yang open
export const getAllEvents = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT e.id, e.title, e.description, e.venue, e.city, e.genre,
             e.event_date, e.event_time, e.poster, e.status, e.artist_id,
             MIN(tc.price) AS min_price
      FROM events e
      LEFT JOIN ticket_categories tc ON tc.event_id = e.id
      WHERE e.status = 'open'
      GROUP BY e.id
      ORDER BY e.event_date ASC
    `);

    if (rows.length === 0) return res.json([]);

    const eventIds = rows.map((r) => r.id);

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
      const primaryArtist = evArtists[0] || null;

      return {
        ...r,
        artist_id: primaryArtist ? primaryArtist.id : r.artist_id,
        artist_name: artistNames || '-',
        artist_photo: primaryArtist ? primaryArtist.photo : null,
        artist_ids: evArtists.map((a) => a.id),
        artists: evArtists,
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Terjadi error di server', error: err.message });
  }
};

// GET /api/customer/events/:id  — detail event + kategori tiket
export const getEventById = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM events WHERE id = ? AND status = ?',
      [req.params.id, 'open']
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Event tidak ditemukan atau sudah selesai' });
    }

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
    const primaryArtist = artists[0] || null;

    const [categories] = await db.query(
      'SELECT id, name, benefits, price, quota, remaining_quota FROM ticket_categories WHERE event_id = ? ORDER BY price ASC',
      [req.params.id]
    );

    res.json({
      ...event,
      artist_id: primaryArtist ? primaryArtist.id : event.artist_id,
      artist_name: artistNames || '-',
      artist_photo: primaryArtist ? primaryArtist.photo : null,
      artist_description: primaryArtist ? primaryArtist.description : null,
      artist_ids: artists.map((a) => a.id),
      artists,
      ticket_categories: categories
    });
  } catch (err) {
    res.status(500).json({ message: 'Terjadi error di server', error: err.message });
  }
};
