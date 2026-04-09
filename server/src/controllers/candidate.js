const CandidateService = require('../services/candidate');

const CandidateController = {
  async getProfile(req, res, next) {
    try {
      const profile = await CandidateService.getProfile(req.user.id);
      res.json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const profile = await CandidateService.updateProfile(req.user.id, req.body);
      res.json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  },

  async uploadResume(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }
      const resumeUrl = `/uploads/cvs/${req.file.filename}`;
      const profile = await CandidateService.updateProfile(req.user.id, { resume_url: resumeUrl });
      res.json({ success: true, data: profile, message: 'Resume uploaded successfully' });
    } catch (error) {
      next(error);
    }
  },

  async uploadAvatar(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      const UserRepository = require('../repositories/user');
      await UserRepository.update(req.user.id, { avatar_url: avatarUrl });
      res.json({
        success: true,
        data: { avatar_url: avatarUrl },
        message: 'Avatar uploaded successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  async uploadProjectImage(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }
      const imageUrl = `/uploads/projects/${req.file.filename}`;
      res.json({
        success: true,
        data: { url: imageUrl },
        message: 'Project image uploaded successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  async syncAIProfile(req, res, next) {
    try {
      const { skills, role_level } = req.body;
      const result = await CandidateService.syncAIProfile(req.user.id, { skills, role_level });
      res.json({
        success: true,
        data: result,
        message: 'Profile synced with AI analysis successfully',
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = CandidateController;
