const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadsRoot } = require('../config/paths');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = uploadsRoot + '/';
    if (file.fieldname === 'avatar') folder += 'avatars/';
    else if (file.fieldname === 'resume') folder += 'cvs/';
    else if (file.fieldname === 'logo') folder += 'company-logos/';
    else if (file.fieldname === 'project_image') folder += 'projects/';

    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
    cb(null, folder);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'resume') {
    if (
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/msword' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file PDF hoặc Word cho CV'), false);
    }
  } else {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh'), false);
    }
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = upload;
