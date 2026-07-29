function isValidObjectId(id) {
  return typeof id === 'string' && /^[a-f\d]{24}$/i.test(id)
}

export default isValidObjectId
