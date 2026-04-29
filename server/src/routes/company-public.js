const express = require('express');
const router = express.Router();
const CompanyController = require('../controllers/company');
const { validate } = require('../middlewares/validation');
const { idParamValidator, paginationValidator } = require('../validations/common');

router.get('/', paginationValidator, validate, CompanyController.getPublicCompanies);
router.get('/:id', idParamValidator, validate, CompanyController.getPublicCompanyById);

module.exports = router;
