import express from 'express';
import { register, login, logout, getStatus } from '../controllers/auth.controller.js';

const router = express.Router();

// Define the POST route for /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

router.post('/logout', logout); // Add Logout Route

router.get('/status', getStatus); // Add Session Status Route

export default router;