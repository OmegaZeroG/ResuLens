// Standard shape for anything thrown deliberately in a controller/service.
// Thrown ApiErrors are caught by the global error middleware in app.js and
// serialized consistently, instead of every route hand-rolling res.status().json().
class ApiError extends Error {
  constructor(statusCode, message = 'Something went wrong', errors = [], stack = '') {
    super(message)
    this.statusCode = statusCode
    this.data = null
    this.success = false
    this.errors = errors

    if (stack) {
      this.stack = stack
    } else {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  static badRequest(message = 'Bad request', errors = []) {
    return new ApiError(400, message, errors)
  }

  static notFound(message = 'Not found') {
    return new ApiError(404, message)
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message)
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message)
  }

  static tooManyRequests(message = 'Too many requests') {
    return new ApiError(429, message)
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, message)
  }
}

export default ApiError
