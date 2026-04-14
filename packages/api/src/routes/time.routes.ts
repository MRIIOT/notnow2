import { Router, type Request, type Response, type NextFunction } from 'express';
import { TimeEntry } from '../models/TimeEntry.js';
import { Team } from '../models/Team.js';
import { Group } from '../models/Group.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { Errors } from '../utils/errors.js';

const router = Router({ mergeParams: true });

// POST /teams/:teamId/time
router.post('/', authenticate, authorize(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { taskId, groupId, hours, date, note } = req.body;
    const entry = await TimeEntry.create({
      teamId: req.params.teamId,
      taskId: taskId || null,
      groupId,
      userId: req.user!.userId,
      hours,
      date: new Date(date),
      note: note || '',
    });
    res.status(201).json({ entry });
  } catch (err) {
    next(err);
  }
});

// GET /teams/:teamId/time
router.get('/', authenticate, authorize(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, weekOf } = req.query;
    const filter: Record<string, unknown> = { teamId: req.params.teamId };

    if (userId) filter.userId = userId;

    if (weekOf) {
      const start = new Date(weekOf as string);
      start.setHours(0, 0, 0, 0);
      // Find Monday of the week
      const day = start.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      start.setDate(start.getDate() + diff);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      filter.date = { $gte: start, $lt: end };
    }

    const entries = await TimeEntry.find(filter).sort({ date: -1 }).populate('taskId', 'title');
    res.json({ entries });
  } catch (err) {
    next(err);
  }
});

// GET /teams/:teamId/time/summary
router.get('/summary', authenticate, authorize(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, weekOf } = req.query;
    if (!userId || !weekOf) throw Errors.validation('userId and weekOf are required');

    const start = new Date(weekOf as string);
    start.setHours(0, 0, 0, 0);
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diff);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const entries = await TimeEntry.find({
      teamId: req.params.teamId,
      userId,
      date: { $gte: start, $lt: end },
    })
      .sort({ date: -1 })
      .populate('taskId', 'title')
      .populate('groupId', 'name');

    // Get team for rates
    const team = await Team.findById(req.params.teamId);
    const member = team?.members.find((m) => m.userId.toString() === userId);

    // Group by groupId
    const byGroup: Record<string, { groupName: string; hours: number; rate: number; entries: typeof entries }> = {};

    for (const entry of entries) {
      const gid = entry.groupId.toString();
      if (!byGroup[gid]) {
        const group = await Group.findById(gid);
        const override = member?.rateOverrides.find((o) => o.groupId.toString() === gid);
        byGroup[gid] = {
          groupName: group?.name || 'Unknown',
          hours: 0,
          rate: override?.rate ?? member?.defaultRate ?? 0,
          entries: [],
        };
      }
      byGroup[gid].hours += entry.hours;
      byGroup[gid].entries.push(entry);
    }

    const groups = Object.values(byGroup);
    const totalHours = groups.reduce((sum, g) => sum + g.hours, 0);
    const totalAmount = groups.reduce((sum, g) => sum + g.hours * g.rate, 0);

    res.json({ groups, totalHours, totalAmount });
  } catch (err) {
    next(err);
  }
});

// PATCH /teams/:teamId/time/:entryId
router.patch('/:entryId', authenticate, authorize(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const entry = await TimeEntry.findOneAndUpdate(
      { _id: req.params.entryId, teamId: req.params.teamId },
      req.body,
      { new: true },
    );
    if (!entry) throw Errors.notFound('Time entry');
    res.json({ entry });
  } catch (err) {
    next(err);
  }
});

// DELETE /teams/:teamId/time/:entryId
router.delete('/:entryId', authenticate, authorize(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const entry = await TimeEntry.findOneAndDelete({ _id: req.params.entryId, teamId: req.params.teamId });
    if (!entry) throw Errors.notFound('Time entry');
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
