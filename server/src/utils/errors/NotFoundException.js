const HttpException = require('./HttpException');

class NotFoundException extends HttpException {
  constructor(message = 'Resource not found') {
    super(message);
    this.status = 404;
  }
}

module.exports = NotFoundException;