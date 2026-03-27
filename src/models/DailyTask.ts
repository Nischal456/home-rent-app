import mongoose, { Schema, model, models } from 'mongoose';

const DailyTaskSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String },
    location: { type: String },
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], default: 'MEDIUM' },
    status: { type: String, enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'], default: 'PENDING' },
    dateBS: { type: String, required: true }, // Store Nepali Date
    dateAD: { type: Date, required: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' }, // Optional specific guard
    // Storage Saver: Storing any extra dynamic data as a JSON/Mixed object
    metadata: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });

const DailyTask = models.DailyTask || model('DailyTask', DailyTaskSchema);
export default DailyTask;