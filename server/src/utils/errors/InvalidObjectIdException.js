const HttpException = require('./HttpException');

class InvalidObjectIdException extends HttpException {
  constructor(message = 'Invalid ID format') {
    super(message, 400);
    this.name = 'InvalidObjectIdException';
  }
}

module.exports = InvalidObjectIdException; 