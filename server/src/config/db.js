import mongoose from 'mongoose'

export async function connectDB(uri) {
  if (!uri) {
    console.warn(
      'MONGO_URI is not set — skipping DB connection (set it in server/.env before building CRUD routes).',
    )
    return
  }
  try {
    await mongoose.connect(uri)
    console.log('MongoDB connected')
  } catch (err) {
    console.error('MongoDB connection error:', err.message)
    process.exit(1)
  }
}
