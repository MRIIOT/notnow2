import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface ISubtask {
  _id: Types.ObjectId;
  title: string;
  completed: boolean;
  sortOrder: number;
}

export interface ITask extends Document {
  teamId: Types.ObjectId;
  groupId: Types.ObjectId;
  title: string;
  notes: string;
  status: 'active' | 'completed' | 'deleted';
  pipelineSection: 'active' | 'queued' | 'waiting' | 'someday';
  pipelineOrder: string;
  energyOrder: string;
  priorityOrder: string;
  kanbanOrder: string;
  groupOrder: string;
  assignees: Types.ObjectId[];
  dueDate: Date | null;
  energy: 'quick' | 'deep' | 'people' | 'hands-on' | null;
  importance: 'urgent-important' | 'important' | 'urgent' | 'neither' | null;
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

const taskSchema = new Schema<ITask>(
  {
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    title: { type: String, required: true, trim: true },
    notes: { type: String, default: '' },
    status: {
      type: String,
      required: true,
      enum: ['active', 'completed', 'deleted'],
      default: 'active',
    },
    pipelineSection: {
      type: String,
      required: true,
      enum: ['active', 'queued', 'waiting', 'someday'],
      default: 'active',
    },
    pipelineOrder: { type: String, default: 'a0' },
    energyOrder: { type: String, default: 'a0' },
    priorityOrder: { type: String, default: 'a0' },
    kanbanOrder: { type: String, default: 'a0' },
    groupOrder: { type: String, default: 'a0' },
    assignees: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    dueDate: { type: Date, default: null },
    energy: { type: String, enum: ['quick', 'deep', 'people', 'hands-on', null], default: null },
    importance: { type: String, enum: ['urgent-important', 'important', 'urgent', 'neither', null], default: null },
    subtasks: { type: [subtaskSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    completedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

taskSchema.index({ teamId: 1, status: 1, pipelineSection: 1, pipelineOrder: 1 });
taskSchema.index({ groupId: 1, status: 1, groupOrder: 1 });
taskSchema.index({ teamId: 1, status: 1, dueDate: 1 });
taskSchema.index({ deletedAt: 1 }, { expireAfterSeconds: 2592000, partialFilterExpression: { deletedAt: { $ne: null } } });
taskSchema.index({ teamId: 1, assignees: 1, status: 1 });

export const Task = mongoose.model<ITask>('Task', taskSchema);
