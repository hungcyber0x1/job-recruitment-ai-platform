const fs = require('fs').promises;

/**
 * Nhận diện loại file từ vài byte đầu (không tin mimetype từ client).
 * @param {Buffer} buf
 * @returns {string|null}  pdf | jpeg | png | gif | webp | zip | ole | null
 */
function detectFileKind(buf) {
  if (!buf || buf.length < 4) {
    return null;
  }
  if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) {
    return 'pdf';
  }
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return 'jpeg';
  }
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return 'png';
  }
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) {
    return 'gif';
  }
  if (
    buf.length >= 12 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'webp';
  }
  if (buf[0] === 0x50 && buf[1] === 0x4b) {
    return 'zip';
  }
  if (buf[0] === 0xd0 && buf[1] === 0xcf && buf[2] === 0x11 && buf[3] === 0xe0) {
    return 'ole';
  }
  return null;
}

/** fieldname multer → các kind được chấp nhận */
const FIELD_RULES = {
  resume: ['pdf', 'zip', 'ole'],
  avatar: ['jpeg', 'png', 'gif', 'webp'],
  logo: ['jpeg', 'png', 'gif', 'webp'],
  project_image: ['jpeg', 'png', 'gif', 'webp'],
  file: ['pdf', 'zip', 'ole'],
};

/**
 * Sau multer: đọc chữ ký nhị phân; sai thì xóa file và 400.
 */
async function verifyUploadSignature(req, res, next) {
  if (!req.file) {
    return next();
  }
  const allowed = FIELD_RULES[req.file.fieldname];
  if (!allowed) {
    return next();
  }

  let fh;
  try {
    fh = await fs.open(req.file.path, 'r');
    const buf = Buffer.alloc(16);
    await fh.read(buf, 0, 16, 0);

    const kind = detectFileKind(buf);
    if (!kind || !allowed.includes(kind)) {
      await fh.close().catch(() => {});
      fh = null;
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({
        success: false,
        message: 'Nội dung file không khớp định dạng cho phép',
      });
    }
    await fh.close();
    return next();
  } catch (err) {
    if (fh) {
      await fh.close().catch(() => {});
    }
    await fs.unlink(req.file.path).catch(() => {});
    return next(err);
  }
}

module.exports = {
  verifyUploadSignature,
  detectFileKind,
  FIELD_RULES,
};
