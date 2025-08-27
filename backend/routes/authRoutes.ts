import express from 'express'

import { login, register, verifyEmail } from "../controllers/authController.ts";
import { authLimiter } from '../middleware/authMiddleware.ts'

const router = express.Router()

router.post('/login', authLimiter, login)
router.post('/register', authLimiter, register)
router.get('/verify-email', verifyEmail)

export default router;