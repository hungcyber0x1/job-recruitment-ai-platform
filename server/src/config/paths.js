const path = require('path');

/** Thư mục gốc lưu file upload công khai — luôn là `server/uploads` (cùng cấp với `server/src`). */
const uploadsRoot = path.join(__dirname, '..', '..', 'uploads');

/** Thư mục upload riêng tư: chỉ phục vụ qua API đã kiểm tra quyền. */
const privateUploadsRoot = path.join(__dirname, '..', '..', 'private-uploads');

const clientDistRoot = path.join(__dirname, '..', '..', '..', 'client', 'dist');

module.exports = { uploadsRoot, privateUploadsRoot, clientDistRoot };
