import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development and across serverless function invocations in production.
 * This prevents connections from growing exponentially.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    // Use existing cached connection
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Recommended for Mongoose v6+
    };
    // Create a new connection promise
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }
  
  try {
    // Wait for the promise to resolve and cache the connection
    cached.conn = await cached.promise;
  } catch (e) {
    // If the connection fails, clear the promise to allow for a retry.
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;