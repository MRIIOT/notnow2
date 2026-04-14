import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface IHandle extends Document {
  handle: string;
  type: 'user' | 'team';
  refId: Types.ObjectId;
}

const handleSchema = new Schema<IHandle>({
  handle: { type: String, required: true, unique: true, lowercase: true, trim: true },
  type: { type: String, required: true, enum: ['user', 'team'] },
  refId: { type: Schema.Types.ObjectId, required: true },
});

export const Handle = mongoose.model<IHandle>('Handle', handleSchema);
