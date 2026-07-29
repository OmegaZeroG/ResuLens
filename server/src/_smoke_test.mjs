import 'dotenv/config'
import mongoose from 'mongoose'
import Resume from './models/Resume.js'

try {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 6000 })
  const doc = await Resume.create({ title: 'Smoke Test Resume', sections: { summary: 'temp' } })
  const found = await Resume.findById(doc._id)
  await Resume.findByIdAndDelete(doc._id)
  process.stdout.write('CRUD_OK id=' + found._id + '\n')
  await mongoose.disconnect()
  process.exit(0)
} catch (err) {
  process.stdout.write('CRUD_FAIL ' + err.message + '\n')
  process.exit(1)
}
