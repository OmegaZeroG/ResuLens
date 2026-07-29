import mongoose from 'mongoose'

const { Schema } = mongoose

const educationSchema = new Schema(
  {
    school: { type: String, trim: true },
    degree: { type: String, trim: true },
    fieldOfStudy: { type: String, trim: true },
    startDate: { type: String, trim: true },
    endDate: { type: String, trim: true },
    gpa: { type: String, trim: true },
  },
  { _id: false },
)

const experienceSchema = new Schema(
  {
    company: { type: String, trim: true },
    role: { type: String, trim: true },
    location: { type: String, trim: true },
    startDate: { type: String, trim: true },
    endDate: { type: String, trim: true },
    current: { type: Boolean, default: false },
    bullets: { type: [String], default: [] },
  },
  { _id: false },
)

const projectSchema = new Schema(
  {
    name: { type: String, trim: true },
    description: { type: String, trim: true },
    link: { type: String, trim: true },
    bullets: { type: [String], default: [] },
  },
  { _id: false },
)

const contactSchema = new Schema(
  {
    fullName: { type: String, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    location: { type: String, trim: true },
    linkedin: { type: String, trim: true },
    portfolio: { type: String, trim: true },
  },
  { _id: false },
)

const resumeSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, default: 'Untitled Resume' },
    photoUrl: { type: String, trim: true },
    // ImageKit's file id — needed to actually delete the file from ImageKit when the
    // photo is removed or replaced, not just clear the URL on our side.
    photoFileId: { type: String, trim: true },
    sections: {
      contact: { type: contactSchema, default: () => ({}) },
      summary: { type: String, trim: true, default: '' },
      education: { type: [educationSchema], default: [] },
      experience: { type: [experienceSchema], default: [] },
      skills: { type: [String], default: [] },
      projects: { type: [projectSchema], default: [] },
    },
  },
  { timestamps: true },
)

export default mongoose.model('Resume', resumeSchema)
