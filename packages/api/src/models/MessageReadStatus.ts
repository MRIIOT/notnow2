import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface IMessageReadStatus extends Document {
  userId: Types.ObjectId;
  taskId: Types.ObjectId;
  lastReadAt: Date;
}

const messageReadStatusSchema = new Schema<IMessageReadStatus>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
  lastReadAt: { type: Date, required: true },
});

messageReadStatusSchema.index({ userId: 1, taskId: 1 }, { unique: true });

export const MessageReadStatus = mongoose.model<IMessageReadStatus>('MessageReadStatus', messageReadStatusSchema);
