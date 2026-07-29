// Standard success-response envelope so every endpoint returns the same shape:
// { success, statusCode, message, data }. Pairs with ApiError, which covers the
// failure case with the same envelope style.
class ApiResponse {
  constructor(statusCode, data = null, message = 'Success') {
    this.statusCode = statusCode
    this.data = data
    this.message = message
    this.success = statusCode < 400
  }

  send(res) {
    return res.status(this.statusCode).json(this)
  }
};

export default ApiResponse
