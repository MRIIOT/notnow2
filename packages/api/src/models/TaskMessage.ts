import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface ITaskMessage extends Document {
  taskId: Types.ObjectId;
  teamId: Types.ObjectId;
  userId: Types.ObjectId;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

const taskMessageSchema = new Schema<ITaskMessage>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true },
  },
  { timestamps: true },
);

taskMessageSchema.index({ taskId: 1, createdAt: 1 });

export const TaskMessage = mongoose.model<ITaskMessage>('TaskMessage', taskMessageSchema);
