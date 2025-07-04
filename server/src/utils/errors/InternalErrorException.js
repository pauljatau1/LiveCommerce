const HttpException = require('./HttpException');

class InternalErrorException extends HttpException {
  constructor(message = 'Internal error!') {
    super(message);
    this.status = 500;
  }
}

module.exports = InternalErrorException;