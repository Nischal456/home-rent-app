import mongoose, { Schema, model, models } from 'mongoose';
import { ISubmission } from '@/types';

const SubmissionSchema = new Schema<ISubmission>({
  name: { type: String, required: true },
  contact: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['UNREAD', 'READ'], default: 'UNREAD' },
}, {
  timestamps: true,
});

const Submission = models.Submission || model<ISubmission>('Submission', SubmissionSchema);

export default Submission;