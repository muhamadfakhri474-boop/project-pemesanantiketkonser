import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../../config/db.js';

// POST /api/admin/auth/login
export const adminLogin = async (req, res) => {
  const { email, identifier, password } = req.body;
  const loginId = (email || identifier || '').trim();

  if (!loginId || !password) {
    return res.status(400).json({ message: 'Email/username dan password wajib diisi' });
  }

  try {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE (email = ? OR name = ?) AND role = ?',
      [loginId, loginId, 'admin']
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Email/username atau password salah' });
    }

    const admin = rows[0];
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email/username atau password salah' });
    }

    const token = jwt.sign(
      { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Login admin berhasil',
      token,
      user: { id: admin.id, name: admin.name, email: admin.email, role: admin.role }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/admin/auth/me
export const adminGetMe = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, phone, role, created_at FROM users WHERE id = ? AND role = ?',
      [req.user.id, 'admin']
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Admin tidak ditemukan' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/admin/auth/register
export const adminRegister = async (req, res) => {
  const { name, email, password, phone, username } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Nama lengkap, email, dan password wajib diisi' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Format email tidak valid' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password minimal 6 karakter' });
  }

  try {
    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email sudah terdaftar dalam sistem' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, phone || null, 'admin']
    );

    res.status(201).json({
      message: 'Registrasi administrator berhasil',
      userId: result.insertId,
      admin: {
        id: result.insertId,
        name,
        email,
        phone: phone || null,
        role: 'admin'
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
