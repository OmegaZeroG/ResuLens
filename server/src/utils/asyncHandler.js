// Wraps an async Express handler so any rejected promise / thrown error is passed
// to next(err) automatically, instead of every controller needing its own try/catch.
function asyncHandler(requestHandler) {
  return function (req, res, next) {
    Promise.resolve(requestHandler(req, res, next)).catch(next)
  }
}

export default asyncHandler
