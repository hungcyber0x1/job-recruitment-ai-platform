const fs = require('fs').promises;

/** Theo ISO 32000, chuỗi %PDF có thể nằm trong 1024 byte đầu (PDF linearized / tiền tố nhị phân). */
const PDF_MARKER = Buffer.from('%PDF');
const PDF_PREFIX_SCAN = 1024;

/**
 * @param {Buffer} buf
 * @returns {boolean}
 */
function hasPdfMarkerInPrefix(buf) {
  const len = Math.min(buf.length, PDF_PREFIX_SCAN);
  if (len < 4) return false;
  return buf.subarray(0, len).includes(PDF_MARKER);
}

/**
 * Nhận diện loại file từ byte đầu (không tin mimetype từ client).
 * PDF: chấp nhận %PDF ngay đầu, sau BOM UTF-8 / khoảng trắng, hoặc trong 1024 byte đầu.
 * @param {Buffer} buf
 * @returns {string|null}  pdf | jpeg | png | gif | webp | zip | ole | null
 */
function detectFileKind(buf) {
  if (!buf || buf.length < 4) {
    return null;
  }

  let o = 0;
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    o = 3;
  }
  while (
    o < buf.length &&
    o < 64 &&
    (buf[o] === 0x20 || buf[o] === 0x09 || buf[o] === 0x0a || buf[o] === 0x0d)
  ) {
    o += 1;
  }
  if (
    o + 4 <= buf.length &&
    buf[o] === 0x25 &&
    buf[o + 1] === 0x50 &&
    buf[o + 2] === 0x44 &&
    buf[o + 3] === 0x46
  ) {
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

  if (hasPdfMarkerInPrefix(buf)) {
    return 'pdf';
  }
  return null;
}

/** fieldname multer → các kind được chấp nhận */
const FIELD_RULES = {
  resume: ['pdf', 'zip', 'ole'],
  message_attachment: ['pdf', 'zip', 'ole'],
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
    const buf = Buffer.alloc(PDF_PREFIX_SCAN);
    const { bytesRead } = await fh.read(buf, 0, PDF_PREFIX_SCAN, 0);
    const head = buf.subarray(0, bytesRead);

    const kind = detectFileKind(head);
    if (!kind || !allowed.includes(kind)) {
      await fh.close().catch(() => { });
      fh = null;
      await fs.unlink(req.file.path).catch(() => { });
      return res.status(400).json({
        success: false,
        message: 'Nội dung file không khớp định dạng cho phép',
      });
    }
    await fh.close();
    req.verifiedUploadKind = kind;
    return next();
  } catch (err) {
    if (fh) {
      await fh.close().catch(() => { });
    }
    await fs.unlink(req.file.path).catch(() => { });
    return next(err);
  }
}

module.exports = {
  verifyUploadSignature,
  detectFileKind,
  FIELD_RULES,
};
