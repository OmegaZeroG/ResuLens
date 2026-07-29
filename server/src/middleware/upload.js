import multer from 'multer'
import ApiError from '../utils/ApiError.js'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

const storage = multer.memoryStorage()

function fileFilter(req, file, cb) {
  if (!file.mimetype.startsWith('image/')) {
    return cb(ApiError.badRequest('Only image files are allowed'))
  }
  cb(null, true)
}

export const uploadPhoto = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
}).single('photo')
