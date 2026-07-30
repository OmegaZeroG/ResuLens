import mongoose from 'mongoose'

const { Schema } = mongoose

// One row per rate-limit check on an AI route (see middleware/rateLimiter.js).
// Purely a usage log — never read by the rate limiter itself (Redis is the
// only source of truth for whether a request is actually allowed). This
// exists so the app can show a user their own usage history instead of the
// limiter being invisible plumbing. Best-effort: a failure to write one of
// these must never affect whether the real request succeeds.
const rateLimitEventSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    route: { type: String, required: true, trim: true }, // 'analyze' | 'improve'
    allowed: { type: Boolean, required: true },
    tier: { type: String, required: true, trim: true },
    cost: { type: Number, required: true },
    remaining: { type: Number, required: true },
  },
  { timestamps: true },
)

// Recent-history queries are always "this user, newest first" — matches the
// same pattern as Analysis.js's index.
rateLimitEventSchema.index({ userId: 1, createdAt: -1 })

export default mongoose.model('RateLimitEvent', rateLimitEventSchema)
