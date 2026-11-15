import mongoose from 'mongoose';

export async function connectDb(uri) {
  if (!uri) throw new Error('MONGO_URI is not set. Copy .env.example to .env first.');
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  return mongoose.connection;
}
