const EmployerService = require('../services/employer');

class EmployerController {
  async getProfile(req, res, next) {
    try {
      const profile = await EmployerService.getProfile(req.user.id);
      res.json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const profile = await EmployerService.updateProfile(req.user.id, req.body);
      res.json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  }

  async uploadLogo(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }
      const logoUrl = `/uploads/company-logos/${req.file.filename}`;
      const profile = await EmployerService.updateProfile(req.user.id, { company_logo: logoUrl });
      res.json({ success: true, data: profile, message: 'Logo uploaded successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EmployerController();
