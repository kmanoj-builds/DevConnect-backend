class ApiError extends Error {
  constructor(statusCode = 500, message = "Server error", details = null) {
    super(message);
    this.statusCode = statusCode;
    if (details) this.details = details;
  }
}
module.exports = ApiError;
