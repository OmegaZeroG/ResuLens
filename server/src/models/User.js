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
    // Gates the admin panel (see middleware/auth.js's requireAdmin). No
    // in-app way to grant this to yourself or anyone else — the first (and
    // any future) admin is set directly via server/scripts/setAdmin.js, run
    // locally against the real database. Deliberate: an admin session being
    // able to mint more admins over the API is a bigger privilege-escalation
    // surface than this project needs.
    isAdmin: { type: Boolean, default: false },
    // Suspend switch for the admin panel. Checked in requireAuth (blocks
    // every authenticated request immediately, regardless of how the token
    // was issued), plus at the two places a fresh token gets minted
    // (password login, OAuth callbacks) so a suspended user sees a clear
    // message instead of a generic-looking failure.
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

userSchema.methods.comparePassword = function comparePassword(candidate) {
  if (!this.passwordHash) return Promise.resolve(false)
  return bcrypt.compare(candidate, this.passwordHash)
}

export default mongoose.model('User', userSchema)
