import multer from 'multer'
import ApiError from '../utils/ApiError.js'
import { ALLOWED_DOCUMENT_MIMES } from '../utils/resumeText.js'

const MAX_FILE_SIZE = 8 * 1024 * 1024 // 8MB — generous for a text-based resume/JD document

const storage = multer.memoryStorage()

function fileFilter(req, file, cb) {
  if (!ALLOWED_DOCUMENT_MIMES.has(file.mimetype)) {
    return cb(ApiError.badRequest('Only PDF, DOCX, or plain text files are allowed'))
  }
  cb(null, true)
}

// Accepts an optional resume file and an optional JD file in one multipart
// request. Both are optional here — analyze.controller.js enforces that at
// least one resume source (file or a saved resumeId) and one JD source (file
// or pasted jdText) is present.
export const uploadAnalyzeFiles = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
}).fields([
  { name: 'resumeFile', maxCount: 1 },
  { name: 'jdFile', maxCount: 1 },
])
