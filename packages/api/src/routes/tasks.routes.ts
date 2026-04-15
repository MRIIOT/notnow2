import { Router, type Request, type Response, type NextFunction } from 'express';
import { Task } from '../models/Task.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import {
  createTaskSchema,
  updateTaskSchema,
  reorderTaskSchema,
  createSubtaskSchema,
  updateSubtaskSchema,
} from '../validators/task.validators.js';
import { generateKeyBetween } from '../services/ordering.service.js';
import { emitTeamEvent } from '../services/socket.service.js';
import { Errors } from '../utils/errors.js';

const router = Router({ mergeParams: true });

// POST /teams/:teamId/tasks
router.post('/', authenticate, authorize(), validate(createTaskSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, groupId, notes, pipelineSection, dueDate, assignees } = req.body;

    // Generate ordering keys: append to end of pipeline and group
    const lastPipeline = await Task.findOne({
      teamId: req.params.teamId,
      status: 'active',
      pipelineSection: pipelineSection || 'above',
    }).sort({ pipelineOrder: -1 });

    const lastGroup = await Task.findOne({
      groupId,
      status: 'active',
    }).sort({ groupOrder: -1 });

    const pipelineOrder = generateKeyBetween(lastPipeline?.pipelineOrder ?? null, null);
    const groupOrder = generateKeyBetween(lastGroup?.groupOrder ?? null, null);

    const task = await Task.create({
      teamId: req.params.teamId,
      groupId,
      title,
      notes: notes || '',
      pipelineSection: pipelineSection || 'above',
      pipelineOrder,
      groupOrder,
      dueDate: dueDate || null,
      assignees: assignees || [],
      createdBy: req.user!.userId,
    });

    res.status(201).json({ task });
    emitTeamEvent(req.app.locals.io, req.params.teamId as string, 'task:created', { task });
  } catch (err) {
    next(err);
  }
});

// GET /teams/:teamId/tasks
router.get('/', authenticate, authorize(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const view = req.query.view as string | undefined;
    const groupId = req.query.groupId as string | undefined;
    const status = req.query.status as string | undefined;
    const filter: Record<string, unknown> = { teamId: req.params.teamId };

    if (status) {
      filter.status = status;
    } else {
      filter.status = { $ne: 'deleted' };
    }

    let sort: Record<string, 1 | -1> = {};

    if (view === 'pipeline') {
      filter.status = 'active';
      sort = { pipelineSection: 1, pipelineOrder: 1 };
    } else if (view === 'upcoming') {
      filter.status = 'active';
      sort = { dueDate: 1 };
    } else if (view === 'group' && groupId) {
      filter.groupId = groupId;
      sort = { groupOrder: 1 };
    } else {
      sort = { createdAt: -1 };
    }

    const tasks = await Task.find(filter).sort(sort);
    res.json({ tasks });
  } catch (err) {
    next(err);
  }
});

// GET /teams/:teamId/tasks/:taskId
router.get('/:taskId', authenticate, authorize(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await Task.findOne({ _id: req.params.taskId, teamId: req.params.teamId });
    if (!task) throw Errors.notFound('Task');
    res.json({ task });
  } catch (err) {
    next(err);
  }
});

// PATCH /teams/:teamId/tasks/:taskId
router.patch('/:taskId', authenticate, authorize(), validate(updateTaskSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await Task.findOne({ _id: req.params.taskId, teamId: req.params.teamId });
    if (!task) throw Errors.notFound('Task');

    const updates = req.body;

    // Handle status transitions
    if (updates.status === 'completed') {
      updates.completedAt = new Date();
    } else if (updates.status === 'deleted') {
      updates.deletedAt = new Date();
    }

    Object.assign(task, updates);
    await task.save();

    res.json({ task });
    emitTeamEvent(req.app.locals.io, req.params.teamId as string, 'task:updated', { task });
  } catch (err) {
    next(err);
  }
});

// DELETE /teams/:teamId/tasks/:taskId (soft delete)
router.delete('/:taskId', authenticate, authorize(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await Task.findOne({ _id: req.params.taskId, teamId: req.params.teamId });
    if (!task) throw Errors.notFound('Task');

    task.status = 'deleted';
    task.deletedAt = new Date();
    await task.save();

    res.json({ ok: true });
    emitTeamEvent(req.app.locals.io, req.params.teamId as string, 'task:deleted', { taskId: req.params.taskId });
  } catch (err) {
    next(err);
  }
});

// POST /teams/:teamId/tasks/:taskId/reorder
router.post(
  '/:taskId/reorder',
  authenticate,
  authorize(),
  validate(reorderTaskSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await Task.findOne({ _id: req.params.taskId, teamId: req.params.teamId });
      if (!task) throw Errors.notFound('Task');

      if (req.body.pipelineOrder !== undefined) task.pipelineOrder = req.body.pipelineOrder;
      if (req.body.groupOrder !== undefined) task.groupOrder = req.body.groupOrder;
      if (req.body.pipelineSection !== undefined) task.pipelineSection = req.body.pipelineSection;

      await task.save();
      res.json({ task });
      emitTeamEvent(req.app.locals.io, req.params.teamId as string, 'task:reordered', { task });
    } catch (err) {
      next(err);
    }
  },
);

// ── Subtasks ──

// POST /teams/:teamId/tasks/:taskId/subtasks
router.post(
  '/:taskId/subtasks',
  authenticate,
  authorize(),
  validate(createSubtaskSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await Task.findOne({ _id: req.params.taskId, teamId: req.params.teamId });
      if (!task) throw Errors.notFound('Task');

      const sortOrder = task.subtasks.length;
      task.subtasks.push({ title: req.body.title, completed: false, sortOrder } as any);
      await task.save();

      res.status(201).json({ task });
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /teams/:teamId/tasks/:taskId/subtasks/:subId
router.patch(
  '/:taskId/subtasks/:subId',
  authenticate,
  authorize(),
  validate(updateSubtaskSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await Task.findOne({ _id: req.params.taskId, teamId: req.params.teamId });
      if (!task) throw Errors.notFound('Task');

      const sub = task.subtasks.find((s) => s._id.toString() === req.params.subId);
      if (!sub) throw Errors.notFound('Subtask');

      if (req.body.title !== undefined) sub.title = req.body.title;
      if (req.body.completed !== undefined) sub.completed = req.body.completed;

      await task.save();
      res.json({ task });
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /teams/:teamId/tasks/:taskId/subtasks/:subId
router.delete(
  '/:taskId/subtasks/:subId',
  authenticate,
  authorize(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await Task.findOne({ _id: req.params.taskId, teamId: req.params.teamId });
      if (!task) throw Errors.notFound('Task');

      task.subtasks = task.subtasks.filter((s) => s._id.toString() !== req.params.subId) as typeof task.subtasks;
      await task.save();
      res.json({ task });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
