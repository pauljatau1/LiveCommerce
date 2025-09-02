const HttpException = require('./HttpException');

class BadRequestException extends HttpException {
  constructor(message = 'Bad Request') {
    super(message, 400);
  }
}

module.exports = BadRequestException;
