import { Schema, model, models, Document, Model } from 'mongoose';

// Interface defining the Notification document structure
export interface INotification extends Document {
  _id: string;
  userId: Schema.Types.ObjectId;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true // Add an index for faster lookups by userId
  },
  title: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  isRead: { 
    type: Boolean, 
    default: false 
  },
  link: { 
    type: String 
  },

  // --- This is the key field for the 7-day logic ---
  createdAt: { 
    type: Date, 
    default: Date.now 
  },

  /*
    // --- OPTION 2: AUTOMATIC DELETION (TTL INDEX) ---
    // If you want to PERMANENTLY DELETE notifications after 7 days,
    // uncomment the following 'createdAt' block and remove the one above.
    
    createdAt: {
      type: Date,
      default: Date.now,
      // MongoDB will automatically delete documents 604800 seconds (7 days) after this date.
      expires: 604800 
    }
  */

});

// Prevents model recompilation in Next.js hot-reloading environments
const Notification: Model<INotification> = models.Notification || model<INotification>('Notification', NotificationSchema);

export default Notification;