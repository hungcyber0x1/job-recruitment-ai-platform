/**
 * ApiResponse - Standardized API response helper.
 *
 * Mục tiêu: Tất cả controller TRẢ VỀ cùng một cấu trúc JSON.
 *
 * Cấu trúc chuẩn:
 *   { success: true, data: ..., meta?: { pagination?, stats?, ... } }
 *   { success: false, message: ..., errors?: ... }
 *
 * Sử dụng:
 *   const ApiResponse = require('../utils/ApiResponse');
 *
 *   // List with pagination + stats
 *   return ApiResponse.success(res, data, { pagination, stats });
 *
 *   // Single resource
 *   return ApiResponse.success(res, user);
 *
 *   // Created
 *   return ApiResponse.created(res, job);
 *
 *   // Error
 *   return ApiResponse.error(res, 400, 'Validation failed', errors);
 *
 *   // No content (DELETE)
 *   return ApiResponse.noContent(res);
 */

class ApiResponse {
  static _normalizeExtras(extras, statusCode) {
    let resolvedExtras = {};
    let resolvedStatusCode = statusCode;

    if (typeof extras === 'string') {
      resolvedExtras = { message: extras };
    } else if (typeof extras === 'number' && Number.isFinite(extras)) {
      resolvedStatusCode = extras;
    } else if (extras && typeof extras === 'object' && !Array.isArray(extras)) {
      resolvedExtras = extras;
    }

    return { resolvedExtras, resolvedStatusCode };
  }

  /**
   * Gửi response thành công.
   * @param {import('express').Response} res
   * @param {*} data - Dữ liệu trả về
   * @param {object} [extras] - { pagination, stats, message }
   * @param {number} [statusCode=200]
   */
  static success(res, data, extras = {}, statusCode = 200) {
    const { resolvedExtras, resolvedStatusCode } = ApiResponse._normalizeExtras(extras, statusCode);
    const payload = { success: true, data };

    if (resolvedExtras.pagination || resolvedExtras.stats || resolvedExtras.message) {
      payload.meta = {};
      if (resolvedExtras.pagination) payload.meta.pagination = resolvedExtras.pagination;
      if (resolvedExtras.stats) payload.meta.stats = resolvedExtras.stats;
      if (resolvedExtras.message) payload.meta.message = resolvedExtras.message;
    }

    return res.status(resolvedStatusCode).json(payload);
  }

  /**
   * Gửi response 201 Created.
   * @param {import('express').Response} res
   * @param {*} data
   * @param {string} [message]
   */
  static created(res, data, message) {
    const payload = { success: true, data };
    if (message) {
      payload.meta = { message };
    }
    return res.status(201).json(payload);
  }

  /**
   * Gửi response lỗi.
   * @param {import('express').Response} res
   * @param {number} statusCode - 400, 401, 403, 404, 500...
   * @param {string} message
   * @param {Array}  [errors] - Chi tiết lỗi validation
   */
  static error(res, statusCode, message, errors) {
    const payload = { success: false, message };
    if (errors && errors.length) payload.errors = errors;
    return res.status(statusCode).json(payload);
  }

  /**
   * 400 Bad Request.
   * @param {import('express').Response} res
   * @param {string} [message]
   * @param {Array} [errors]
   */
  static badRequest(res, message = 'Bad Request', errors) {
    return ApiResponse.error(res, 400, message, errors);
  }

  /**
   * 204 No Content - dùng cho DELETE thành công.
   * @param {import('express').Response} res
   */
  static noContent(res) {
    return res.status(204).send();
  }

  /**
   * 401 Unauthorized - chưa đăng nhập.
   * @param {import('express').Response} res
   * @param {string} [message]
   */
  static unauthorized(res, message = 'Unauthorized') {
    return ApiResponse.error(res, 401, message);
  }

  /**
   * 403 Forbidden - không có quyền.
   * @param {import('express').Response} res
   * @param {string} [message]
   */
  static forbidden(res, message = 'Forbidden') {
    return ApiResponse.error(res, 403, message);
  }

  /**
   * 404 Not Found.
   * @param {import('express').Response} res
   * @param {string} [resourceName]
   */
  static notFound(res, resourceName = 'Resource') {
    return ApiResponse.error(res, 404, `${resourceName} not found`);
  }
}

module.exports = ApiResponse;
module.exports.ApiResponse = ApiResponse;
