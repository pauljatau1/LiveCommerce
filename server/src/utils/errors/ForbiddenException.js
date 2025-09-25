const HttpException = require('./HttpException');

class ForbiddenException extends HttpException {
  constructor(message = 'Access forbidden') {
    super(message, 403);
    this.status = 403;
  }
}

module.exports = ForbiddenException;
