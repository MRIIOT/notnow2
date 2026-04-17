import { Router, type Request, type Response, type NextFunction } from 'express';
import { TaskMessage } from '../models/TaskMessage.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { Errors } from '../utils/errors.js';

const router = Router({ mergeParams: true });

// GET /teams/:teamId/tasks/:taskId/messages
router.get('/', authenticate, authorize(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const messages = await TaskMessage.find({
      taskId: req.params.taskId,
      teamId: req.params.teamId,
    })
      .sort({ createdAt: 1 })
      .populate('userId', 'username displayName');
    res.json({ messages });
  } catch (err) {
    next(err);
  }
});

// GET /teams/:teamId/tasks/:taskId/messages/count
router.get('/count', authenticate, authorize(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await TaskMessage.countDocuments({
      taskId: req.params.taskId,
      teamId: req.params.teamId,
    });
    res.json({ count });
  } catch (err) {
    next(err);
  }
});

// POST /teams/:teamId/tasks/:taskId/messages
router.post('/', authenticate, authorize(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { body } = req.body;
    if (!body?.trim()) throw Errors.validation('Message body is required');

    const message = await TaskMessage.create({
      taskId: req.params.taskId,
      teamId: req.params.teamId,
      userId: req.user!.userId,
      body: body.trim(),
    });

    const populated = await TaskMessage.findById(message._id).populate('userId', 'username displayName');
    res.status(201).json({ message: populated });
  } catch (err) {
    next(err);
  }
});

// DELETE /teams/:teamId/tasks/:taskId/messages/:messageId
router.delete('/:messageId', authenticate, authorize(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const message = await TaskMessage.findOne({
      _id: req.params.messageId,
      taskId: req.params.taskId,
      teamId: req.params.teamId,
    });
    if (!message) throw Errors.notFound('Message');

    // Only the author or admins can delete
    if (message.userId.toString() !== req.user!.userId) {
      throw Errors.forbidden('Only the author can delete their message');
    }

    await message.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Standalone route for batch message counts (mounted separately)
export const messageCountsRouter = Router({ mergeParams: true });

// GET /teams/:teamId/message-counts
messageCountsRouter.get('/', authenticate, authorize(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const counts = await TaskMessage.aggregate([
      { $match: { teamId: new (await import('mongoose')).default.Types.ObjectId(req.params.teamId as string) } },
      { $group: { _id: '$taskId', count: { $sum: 1 } } },
    ]);
    const map: Record<string, number> = {};
    for (const c of counts) {
      map[c._id.toString()] = c.count;
    }
    res.json({ counts: map });
  } catch (err) {
    next(err);
  }
});

export default router;
