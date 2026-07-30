import mongoose from 'mongoose'

const { Schema } = mongoose

const analysisSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // Absent when the resume side came from an uploaded file rather than a
    // resume already saved in ResuLens.
    resumeId: { type: Schema.Types.ObjectId, ref: 'Resume' },
    resumeSource: { type: String, enum: ['saved', 'upload'], required: true },
    jdText: { type: String, required: true, trim: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    matchedKeywords: { type: [String], default: [] },
    missingKeywords: { type: [String], default: [] },
    suggestions: { type: [String], default: [] },
  },
  { timestamps: true },
)

export default mongoose.model('Analysis', analysisSchema)
