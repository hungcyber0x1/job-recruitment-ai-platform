exports.successResponse = (res, data, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

exports.errorResponse = (res, message = 'Error', statusCode = 500) => {
  res.status(statusCode).json({
    success: false,
    error: message,
  });
};
