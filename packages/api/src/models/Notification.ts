import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface INotification extends Document {
  userId: Types.ObjectId;
  teamId: Types.ObjectId;
  type: 'reminder' | 'task_assigned' | 'task_completed';
  title: string;
  message: string;
  taskId: Types.ObjectId | null;
  read: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    type: { type: String, required: true, enum: ['reminder', 'task_assigned', 'task_completed'] },
    title: { type: String, required: true },
    message: { type: String, default: '' },
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', default: null },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
