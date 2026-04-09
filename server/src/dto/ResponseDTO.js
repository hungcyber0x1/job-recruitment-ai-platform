class ResponseDTO {
  constructor(success, message, data = null, errors = null) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.errors = errors;
    this.timestamp = new Date().toISOString();
  }

  static success(message, data) {
    return new ResponseDTO(true, message, data);
  }

  static error(message, errors = null) {
    return new ResponseDTO(false, message, null, errors);
  }
}

module.exports = ResponseDTO;
