import mongoose from 'mongoose';

let isConnected = false;

export async function connectToDatabase(uri?: string) {
  if (isConnected && mongoose.connection.readyState === 1) {
    return true;
  }

  const dbUri = uri || process.env.MONGODB_URI;
  if (!dbUri) {
    console.warn('MONGODB_URI not provided. Running in memory / fallback mode until MONGODB_URI is configured.');
    return false;
  }

  try {
    await mongoose.connect(dbUri);
    isConnected = true;
    console.log('Successfully connected to MongoDB.');
    return true;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    return false;
  }
}

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
