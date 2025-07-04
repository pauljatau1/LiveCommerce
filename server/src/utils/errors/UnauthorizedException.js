class UnauthorizedException extends Error {
  constructor(message = "Access denied!", statusCode = 401) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = UnauthorizedException;