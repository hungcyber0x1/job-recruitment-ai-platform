const fs = require('fs');
const path = require('path');
const { privateUploadsRoot, uploadsRoot } = require('../config/paths');

function ensureDir(folder) {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
}

const storage = multerDiskStorage();

function multerDiskStorage() {
  const multer = require('multer');
  return multer.diskStorage({
    destination: function (req, file, cb) {
      let folder = uploadsRoot + path.sep;
      if (file.fieldname === 'avatar') folder += 'avatars' + path.sep;
      else if (file.fieldname === 'resume') folder += 'cvs' + path.sep;
      else if (file.fieldname === 'message_attachment')
        folder = path.join(privateUploadsRoot, 'messages') + path.sep;
      else if (file.fieldname === 'logo') folder += 'company-logos' + path.sep;
      else if (file.fieldname === 'site_logo') folder += 'site-logos' + path.sep;
      else if (file.fieldname === 'project_image') folder += 'projects' + path.sep;

      ensureDir(folder);
      cb(null, folder);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    },
  });
}

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'resume' || file.fieldname === 'message_attachment') {
    if (
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/msword' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.mimetype === 'application/vnd.ms-powerpoint' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file PDF, Word hoặc PowerPoint'), false);
    }
  } else if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh'), false);
  }
};

const multer = require('multer');
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = upload;
