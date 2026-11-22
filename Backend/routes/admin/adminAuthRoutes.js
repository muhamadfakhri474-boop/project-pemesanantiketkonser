import express from 'express';
import { adminLogin, adminGetMe, adminRegister } from '../../controllers/admin/adminAuthController.js';
import { verifyToken, verifyAdmin } from '../../middlewares/authMiddleware.js';

const router = express.Router();

// POST /api/admin/auth/login
router.post('/login', adminLogin);

// POST /api/admin/auth/register
router.post('/register', adminRegister);

// GET /api/admin/auth/me  (perlu token admin)
router.get('/me', verifyToken, verifyAdmin, adminGetMe);

export default router;
