import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface ISubtask {
  _id: Types.ObjectId;
  title: string;
  completed: boolean;
  sortOrder: number;
}

export interface IReminder {
  date: Date;
  sent: boolean;
}

export interface ITask extends Document {
  teamId: Types.ObjectId;
  groupId: Types.ObjectId;
  title: string;
  notes: string;
  status: 'active' | 'completed' | 'cancelled' | 'deleted';
  cancelReason: string;
  pipelineSection: 'above' | 'below' | 'waiting' | 'someday';
  pipelineOrder: string;
  groupOrder: string;
  assignees: Types.ObjectId[];
  dueDate: Date | null;
  reminders: IReminder[];
  subtasks: ISubtask[];
  createdBy: Types.ObjectId;
  completedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const subtaskSchema = new Schema<ISubtask>({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
});

const reminderSchema = new Schema<IReminder>(
  {
    date: { type: Date, required: true },
    sent: { type: Boolean, default: false },
  },
  { _id: false },
);

const taskSchema = new Schema<ITask>(
  {
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    title: { type: String, required: true, trim: true },
    notes: { type: String, default: '' },
    status: {
      type: String,
      required: true,
      enum: ['active', 'completed', 'cancelled', 'deleted'],
      default: 'active',
    },
    cancelReason: { type: String, default: '' },
    pipelineSection: {
      type: String,
      required: true,
      enum: ['above', 'below', 'waiting', 'someday'],
      default: 'above',
    },
    pipelineOrder: { type: String, default: 'a0' },
    groupOrder: { type: String, default: 'a0' },
    assignees: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    dueDate: { type: Date, default: null },
    reminders: { type: [reminderSchema], default: [] },
    subtasks: { type: [subtaskSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    completedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Pipeline view
taskSchema.index({ teamId: 1, status: 1, pipelineSection: 1, pipelineOrder: 1 });
// Group view
taskSchema.index({ groupId: 1, status: 1, groupOrder: 1 });
// Upcoming view
taskSchema.index({ teamId: 1, status: 1, dueDate: 1 });
// Soft delete TTL (30 days)
taskSchema.index({ deletedAt: 1 }, { expireAfterSeconds: 2592000, partialFilterExpression: { deletedAt: { $ne: null } } });
// Assignee lookup
taskSchema.index({ teamId: 1, assignees: 1, status: 1 });

export const Task = mongoose.model<ITask>('Task', taskSchema);
