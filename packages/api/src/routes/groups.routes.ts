import { Router, type Request, type Response, type NextFunction } from 'express';
import { Group } from '../models/Group.js';
import { Task } from '../models/Task.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { createGroupSchema, updateGroupSchema } from '../validators/task.validators.js';
import { Errors } from '../utils/errors.js';

const router = Router({ mergeParams: true });

// POST /teams/:teamId/groups
router.post('/', authenticate, authorize(), validate(createGroupSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lastGroup = await Group.findOne({ teamId: req.params.teamId }).sort({ sortOrder: -1 });
    const sortOrder = lastGroup ? lastGroup.sortOrder + 1 : 0;

    const group = await Group.create({
      teamId: req.params.teamId,
      name: req.body.name,
      sortOrder,
    });
    res.status(201).json({ group });
  } catch (err) {
    next(err);
  }
});

// GET /teams/:teamId/groups
router.get('/', authenticate, authorize(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const groups = await Group.find({ teamId: req.params.teamId, archived: false }).sort({ sortOrder: 1 });
    res.json({ groups });
  } catch (err) {
    next(err);
  }
});

// PATCH /teams/:teamId/groups/:groupId
router.patch('/:groupId', authenticate, authorize(), validate(updateGroupSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const group = await Group.findOneAndUpdate(
      { _id: req.params.groupId, teamId: req.params.teamId },
      req.body,
      { new: true },
    );
    if (!group) throw Errors.notFound('Group');
    res.json({ group });
  } catch (err) {
    next(err);
  }
});

// DELETE /teams/:teamId/groups/:groupId
router.delete('/:groupId', authenticate, authorize('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activeCount = await Task.countDocuments({ groupId: req.params.groupId, status: 'active' });
    if (activeCount > 0) throw Errors.conflict('Cannot delete a group with active tasks');

    const group = await Group.findOneAndDelete({ _id: req.params.groupId, teamId: req.params.teamId });
    if (!group) throw Errors.notFound('Group');
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// POST /teams/:teamId/groups/reorder
router.post('/reorder', authenticate, authorize(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) throw Errors.validation('orderedIds must be an array');

    const ops = orderedIds.map((id: string, i: number) => ({
      updateOne: {
        filter: { _id: id, teamId: req.params.teamId },
        update: { sortOrder: i },
      },
    }));
    await Group.bulkWrite(ops);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
