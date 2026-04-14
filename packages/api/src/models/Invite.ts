import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface IInvite extends Document {
  teamId: Types.ObjectId;
  invitedUserId: Types.ObjectId;
  invitedBy: Types.ObjectId;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
}

const inviteSchema = new Schema<IInvite>(
  {
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    invitedUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, required: true, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
  },
  { timestamps: true },
);

inviteSchema.index({ invitedUserId: 1, status: 1 });
inviteSchema.index({ teamId: 1 });

export const Invite = mongoose.model<IInvite>('Invite', inviteSchema);
