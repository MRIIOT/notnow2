import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface ITeamMember {
  userId: Types.ObjectId;
  role: 'owner' | 'admin' | 'member';
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

const teamMemberSchema = new Schema<ITeamMember>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, required: true, enum: ['owner', 'admin', 'member'], default: 'member' },
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
