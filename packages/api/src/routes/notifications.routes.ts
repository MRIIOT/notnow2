import { Router, type Request, type Response, type NextFunction } from 'express';
import { Notification } from '../models/Notification.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

// GET /notifications - list my notifications
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notifications = await Notification.find({ userId: req.user!.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ notifications });
  } catch (err) {
    next(err);
  }
});

// GET /notifications/unread-count
router.get('/unread-count', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await Notification.countDocuments({ userId: req.user!.userId, read: false });
    res.json({ count });
  } catch (err) {
    next(err);
  }
});

// POST /notifications/:id/read
router.post('/:id/read', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!.userId },
      { read: true },
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// POST /notifications/read-all
router.post('/read-all', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await Notification.updateMany({ userId: req.user!.userId, read: false }, { read: true });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
