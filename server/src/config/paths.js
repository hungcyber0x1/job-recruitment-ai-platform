const path = require('path');

/** Thư mục gốc lưu file upload — luôn là `server/uploads` (cùng cấp với `server/src`). */
const uploadsRoot = path.join(__dirname, '..', '..', 'uploads');

module.exports = { uploadsRoot };
