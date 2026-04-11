const CompanyRepository = require('../models/Company');

class CompanyController {
  async getAllCompanies(req, res, next) {
    try {
      const { search, industry, is_verified, page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const companies = await CompanyRepository.findAllWithFilters({
        search,
        industry,
        is_verified,
        limit,
        offset,
      });

      res.json({
        success: true,
        data: companies,
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyCompany(req, res, next) {
    try {
      const { id } = req.params;
      const { is_verified } = req.body;

      const updated = await CompanyRepository.verifyCompany(id, is_verified);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Company not found' });
      }

      res.json({
        success: true,
        message: is_verified ? 'Company verified successfully' : 'Company verification removed',
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCompany(req, res, next) {
    try {
      const { id } = req.params;
      // Note: Ideally we should check if company has active jobs or delete them too (CASCADE).
      // For now, simple delete.
      await CompanyRepository.delete(id);
      res.json({ success: true, message: 'Company deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CompanyController();
