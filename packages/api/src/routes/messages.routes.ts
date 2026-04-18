import { Router, type Request, type Response, type NextFunction } from 'express';
import mongoose from 'mongoose';
import { TaskMessage } from '../models/TaskMessage.js';
import { MessageReadStatus } from '../models/MessageReadStatus.js';
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

// POST /teams/:teamId/tasks/:taskId/messages/mark-read
router.post('/mark-read', authenticate, authorize(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await MessageReadStatus.findOneAndUpdate(
      { userId: req.user!.userId, taskId: req.params.taskId },
      { lastReadAt: new Date() },
      { upsert: true },
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Standalone route for batch message counts + unread (mounted separately)
export const messageCountsRouter = Router({ mergeParams: true });

// GET /teams/:teamId/message-counts
messageCountsRouter.get('/', authenticate, authorize(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const teamOid = new mongoose.Types.ObjectId(req.params.teamId as string);

    // Get total counts and latest message time per task
    const agg = await TaskMessage.aggregate([
      { $match: { teamId: teamOid } },
      { $group: { _id: '$taskId', count: { $sum: 1 }, latestAt: { $max: '$createdAt' } } },
    ]);

    // Get read statuses for this user
    const readStatuses = await MessageReadStatus.find({ userId: req.user!.userId });
    const readMap = new Map(readStatuses.map((r) => [r.taskId.toString(), r.lastReadAt]));

    const counts: Record<string, number> = {};
    const unread: Record<string, boolean> = {};

    for (const item of agg) {
      const taskId = item._id.toString();
      counts[taskId] = item.count;
      const lastRead = readMap.get(taskId);
      unread[taskId] = !lastRead || item.latestAt > lastRead;
    }

    res.json({ counts, unread });
  } catch (err) {
    next(err);
  }
});

export default router;
