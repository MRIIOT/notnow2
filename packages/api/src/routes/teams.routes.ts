import { Router, type Request, type Response, type NextFunction } from 'express';
import { Team } from '../models/Team.js';
import { Handle } from '../models/Handle.js';
import { User } from '../models/User.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { createTeamSchema, addMemberSchema, updateMemberSchema } from '../validators/team.validators.js';
import { Errors } from '../utils/errors.js';
import mongoose from 'mongoose';

const router = Router();

// Helper to enrich team with member usernames
async function enrichTeam(team: any) {
  const obj = team.toObject ? team.toObject() : { ...team };
  const userIds = obj.members.map((m: any) => m.userId);
  const users = await User.find({ _id: { $in: userIds } }).select('username displayName');
  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  obj.members = obj.members.map((m: any) => {
    const user = userMap.get(m.userId.toString());
    return { ...m, username: user?.username || 'unknown', displayName: user?.displayName || '' };
  });
  return obj;
}

async function enrichTeams(teams: any[]) {
  return Promise.all(teams.map(enrichTeam));
}

// POST /teams - create a team
router.post('/', authenticate, validate(createTeamSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { handle, displayName } = req.body;

    const existing = await Handle.findOne({ handle });
    if (existing) throw Errors.handleTaken();

    const team = await Team.create({
      handle,
      displayName,
      createdBy: req.user!.userId,
      members: [
        {
          userId: req.user!.userId,
          role: 'owner',
          joinedAt: new Date(),
        },
      ],
    });

    await Handle.create({ handle, type: 'team', refId: team._id });

    res.status(201).json({ team });
  } catch (err) {
    next(err);
  }
});

// GET /teams - list my teams
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const teams = await Team.find({ 'members.userId': req.user!.userId });
    res.json({ teams: await enrichTeams(teams) });
  } catch (err) {
    next(err);
  }
});

// GET /teams/:teamId
router.get('/:teamId', authenticate, authorize(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const team = await Team.findById(req.params.teamId);
    if (!team) throw Errors.notFound('Team');
    res.json({ team: await enrichTeam(team) });
  } catch (err) {
    next(err);
  }
});

// PATCH /teams/:teamId
router.patch('/:teamId', authenticate, authorize('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const team = await Team.findByIdAndUpdate(req.params.teamId, { displayName: req.body.displayName }, { new: true });
    res.json({ team });
  } catch (err) {
    next(err);
  }
});

// POST /teams/:teamId/members - add a member
router.post(
  '/:teamId/members',
  authenticate,
  authorize('admin'),
  validate(addMemberSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, role } = req.body;
      const user = await User.findOne({ username });
      if (!user) throw Errors.notFound('User');

      const team = await Team.findById(req.params.teamId);
      if (!team) throw Errors.notFound('Team');

      const already = team.members.find((m) => m.userId.toString() === user._id.toString());
      if (already) throw Errors.conflict('User is already a member');

      team.members.push({
        userId: user._id as mongoose.Types.ObjectId,
        role,
        joinedAt: new Date(),
      });
      await team.save();

      res.status(201).json({ team });
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /teams/:teamId/members/:userId - update member
router.patch(
  '/:teamId/members/:userId',
  authenticate,
  authorize('admin'),
  validate(updateMemberSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const team = await Team.findById(req.params.teamId);
      if (!team) throw Errors.notFound('Team');

      const member = team.members.find((m) => m.userId.toString() === req.params.userId);
      if (!member) throw Errors.notFound('Member');

      if (req.body.role !== undefined) member.role = req.body.role;

      await team.save();
      res.json({ team });
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /teams/:teamId/members/:userId
router.delete(
  '/:teamId/members/:userId',
  authenticate,
  authorize('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const team = await Team.findById(req.params.teamId);
      if (!team) throw Errors.notFound('Team');

      team.members = team.members.filter((m) => m.userId.toString() !== req.params.userId) as typeof team.members;
      await team.save();
      res.json({ team });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
