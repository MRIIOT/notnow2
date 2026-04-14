import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface IRateOverride {
  groupId: Types.ObjectId;
  rate: number; // cents per hour
}

export interface ITeamMember {
  userId: Types.ObjectId;
  role: 'owner' | 'admin' | 'member';
  timeTrackingEnabled: boolean;
  defaultRate: number; // cents per hour
  rateOverrides: IRateOverride[];
  joinedAt: Date;
}

export interface ITeam extends Document {
  handle: string;
  displayName: string;
  createdBy: Types.ObjectId;
  members: ITeamMember[];
  createdAt: Date;
  updatedAt: Date;
}

const rateOverrideSchema = new Schema<IRateOverride>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    rate: { type: Number, required: true },
  },
  { _id: false },
);

const teamMemberSchema = new Schema<ITeamMember>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, required: true, enum: ['owner', 'admin', 'member'], default: 'member' },
    timeTrackingEnabled: { type: Boolean, default: false },
    defaultRate: { type: Number, default: 0 },
    rateOverrides: { type: [rateOverrideSchema], default: [] },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const teamSchema = new Schema<ITeam>(
  {
    handle: { type: String, required: true, unique: true, lowercase: true, trim: true },
    displayName: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: { type: [teamMemberSchema], default: [] },
  },
  { timestamps: true },
);

teamSchema.index({ 'members.userId': 1 });

export const Team = mongoose.model<ITeam>('Team', teamSchema);
