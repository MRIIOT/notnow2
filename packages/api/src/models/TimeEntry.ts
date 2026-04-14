import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface ITimeEntry extends Document {
  teamId: Types.ObjectId;
  taskId: Types.ObjectId | null;
  groupId: Types.ObjectId;
  userId: Types.ObjectId;
  hours: number;
  date: Date;
  note: string;
  createdAt: Date;
  updatedAt: Date;
}

const timeEntrySchema = new Schema<ITimeEntry>(
  {
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', default: null },
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    hours: { type: Number, required: true },
    date: { type: Date, required: true },
    note: { type: String, default: '' },
  },
  { timestamps: true },
);

timeEntrySchema.index({ teamId: 1, userId: 1, date: -1 });
timeEntrySchema.index({ taskId: 1 });
timeEntrySchema.index({ teamId: 1, groupId: 1, date: -1 });

export const TimeEntry = mongoose.model<ITimeEntry>('TimeEntry', timeEntrySchema);
