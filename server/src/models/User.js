import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const { Schema } = mongoose

const userSchema = new Schema(
  {
    name: { type: String, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    // select: false — never comes back on a normal find()/findById(); you have to
    // explicitly .select('+passwordHash') for it, which makes it hard to
    // accidentally leak a hash in an API response.
    // Not required — accounts created via Google/GitHub have no password at all.
    passwordHash: { type: String, select: false },
    // unique + sparse so multiple users with no googleId/githubId (the common
    // case) don't collide on a shared `null` value under the unique index.
    googleId: { type: String, unique: true, sparse: true },
    githubId: { type: String, unique: true, sparse: true },
    avatarUrl: { type: String, trim: true },
    plan: { type: String, enum: ['free', 'premium'], default: 'free' },
  },
  { timestamps: true },
)

userSchema.methods.comparePassword = function comparePassword(candidate) {
  if (!this.passwordHash) return Promise.resolve(false)
  return bcrypt.compare(candidate, this.passwordHash)
}

export default mongoose.model('User', userSchema)
