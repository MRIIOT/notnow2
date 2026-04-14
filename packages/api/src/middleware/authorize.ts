import type { Request, Response, NextFunction } from 'express';
import { Team } from '../models/Team.js';
import { Errors } from '../utils/errors.js';

const roleHierarchy = { owner: 3, admin: 2, member: 1 };

export function authorize(minRole: 'member' | 'admin' | 'owner' = 'member') {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const teamId = req.params.teamId;
      if (!teamId) return next(Errors.validation('teamId is required'));
      if (!req.user) return next(Errors.unauthorized());

      const team = await Team.findById(teamId);
      if (!team) return next(Errors.notFound('Team'));

      const member = team.members.find((m) => m.userId.toString() === req.user!.userId);
      if (!member) return next(Errors.forbidden('Not a team member'));

      if (roleHierarchy[member.role] < roleHierarchy[minRole]) {
        return next(Errors.forbidden(`Requires ${minRole} role`));
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
