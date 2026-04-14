import { Router, type Request, type Response, type NextFunction } from 'express';
import { Task } from '../models/Task.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { Errors } from '../utils/errors.js';

const router = Router({ mergeParams: true });

// GET /teams/:teamId/trash
router.get('/', authenticate, authorize(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tasks = await Task.find({
      teamId: req.params.teamId,
      status: 'deleted',
    }).sort({ deletedAt: -1 });
    res.json({ tasks });
  } catch (err) {
    next(err);
  }
});

// POST /teams/:teamId/trash/:taskId/restore
router.post('/:taskId/restore', authenticate, authorize(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await Task.findOne({
      _id: req.params.taskId,
      teamId: req.params.teamId,
      status: 'deleted',
    });
    if (!task) throw Errors.notFound('Task');

    task.status = 'active';
    task.deletedAt = null;
    await task.save();

    res.json({ task });
  } catch (err) {
    next(err);
  }
});

// DELETE /teams/:teamId/trash/:taskId (permanent)
router.delete('/:taskId', authenticate, authorize('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.taskId,
      teamId: req.params.teamId,
      status: 'deleted',
    });
    if (!task) throw Errors.notFound('Task');
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
