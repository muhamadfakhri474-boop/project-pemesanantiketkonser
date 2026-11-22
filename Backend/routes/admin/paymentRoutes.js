import express from 'express';
import {
  getAllPayments,
  getPaymentById,
  verifyPayment,
  rejectPayment
} from '../../controllers/admin/paymentController.js';
import { verifyToken, verifyAdmin } from '../../middlewares/authMiddleware.js';

const router = express.Router();

router.use(verifyToken, verifyAdmin);

router.get('/', getAllPayments);
router.patch('/:id/verify', verifyPayment);
router.patch('/:id/reject', rejectPayment);
router.get('/:id', getPaymentById);

export default router;
