import mongoose from 'mongoose';

// The MONGODB_URI must be defined in your .env.local file
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
  // If we have a cached connection, reuse it immediately.
  if (cached.conn) {
    console.log('Using cached database connection');
    return cached.conn;
  }

  // If a connection promise is not already in progress, create a new one.
  if (!cached.promise) {
    console.log('Creating new database connection promise');
    const opts = {
      bufferCommands: false, // Recommended for Mongoose v6+
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('Database connected successfully');
      return mongoose;
    });
  }
  
  try {
    // Wait for the connection promise to resolve and cache the connection.
    cached.conn = await cached.promise;
  } catch (e) {
    // If the connection fails, clear the promise to allow for a retry.
    cached.promise = null;
    console.error('Database connection failed:', e);
    throw e; // Re-throw the error to be handled by the API route
  }

  return cached.conn;
}

export default dbConnect;