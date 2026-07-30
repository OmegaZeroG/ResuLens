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
    liveLink: { type: String, trim: true },
    githubLink: { type: String, trim: true },
    // Deprecated — superseded by liveLink/githubLink above. Kept declared
    // (never actually removed from the schema) purely so a resume saved
    // before that split still returns its old value from the API; Mongoose
    // silently drops any field not declared in the schema when a document is
    // read back out, so removing this outright would have made old projects'
    // links permanently unreadable rather than just unused.
    link: { type: String, trim: true },
    bullets: { type: [String], default: [] },
  },
  { _id: false },
)

// Freeform, user-titled sections (Certifications, Awards, Publications,
// Volunteer Experience, etc.) — anything that doesn't fit the fixed sections
// above. A resume can have any number of these, each with its own title.
const customSectionSchema = new Schema(
  {
    title: { type: String, trim: true },
    bullets: { type: [String], default: [] },
  },
  { _id: false },
)

// A free-form profile link — LinkedIn, GitHub, LeetCode, Codeforces, a
// personal site, anything. `label` drives which icon renders next to it.
const contactLinkSchema = new Schema(
  {
    label: { type: String, trim: true },
    url: { type: String, trim: true },
  },
  { _id: false },
)

const contactSchema = new Schema(
  {
    fullName: { type: String, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    location: { type: String, trim: true },
    // Deprecated — superseded by `links` below. Kept declared (never
    // removed) for the same reason as projectSchema.link above: so a resume
    // saved before this change still returns its old value to migrate from,
    // instead of Mongoose silently dropping it on read.
    linkedin: { type: String, trim: true },
    portfolio: { type: String, trim: true },
    links: { type: [contactLinkSchema], default: [] },
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
      customSections: { type: [customSectionSchema], default: [] },
    },
  },
  { timestamps: true },
)

export default mongoose.model('Resume', resumeSchema)
