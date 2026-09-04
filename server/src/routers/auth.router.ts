import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import authController from '../controllers/auth.controller.js';

const router = Router();

router.post('/signup', async (req, res, next) => {
  try {
    await authController.signup(req, res);
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    await authController.login(req, res);
  } catch (err) {
    next(err);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    await authController.logout(req, res);
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    await authController.me(req, res);
  } catch (err) {
    next(err);
  }
});

export default router;
