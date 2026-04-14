import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface IGroup extends Document {
  teamId: Types.ObjectId;
  name: string;
  sortOrder: number;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const groupSchema = new Schema<IGroup>(
  {
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    name: { type: String, required: true, trim: true },
    sortOrder: { type: Number, default: 0 },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true },
);

groupSchema.index({ teamId: 1, sortOrder: 1 });
groupSchema.index({ teamId: 1, name: 1 }, { unique: true });

export const Group = mongoose.model<IGroup>('Group', groupSchema);
