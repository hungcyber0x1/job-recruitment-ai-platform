const ApplicationService = require('../services/application');
const CandidateRepository = require('../models/Candidate');
const EmployerRepository = require('../models/Employer');

class ApplicationController {
  async apply(req, res, next) {
    try {
      const candidate = await CandidateRepository.findByUserId(req.user.id);
      if (!candidate)
        return res.status(403).json({ success: false, message: 'Only candidates can apply' });

      const applicationId = await ApplicationService.applyToJob(
        candidate.id,
        req.params.jobId,
        req.body
      );
      res.status(201).json({ success: true, data: { id: applicationId } });
    } catch (error) {
      next(error);
    }
  }

  async getMyApplications(req, res, next) {
    try {
      const candidate = await CandidateRepository.findByUserId(req.user.id);
      if (!candidate)
        return res
          .status(403)
          .json({ success: false, message: 'Only candidates can view their applications' });

      const applications = await ApplicationService.getCandidateApplications(candidate.id);
      res.json({ success: true, data: applications });
    } catch (error) {
      next(error);
    }
  }

  async getMyNotifications(req, res, next) {
    try {
      const candidate = await CandidateRepository.findByUserId(req.user.id);
      if (!candidate)
        return res
          .status(403)
          .json({ success: false, message: 'Only candidates can view notifications' });

      const notifications = await ApplicationService.getCandidateNotifications(candidate.id);
      res.json({ success: true, data: notifications });
    } catch (error) {
      next(error);
    }
  }

  async getMyApplication(req, res, next) {
    try {
      const candidate = await CandidateRepository.findByUserId(req.user.id);
      if (!candidate)
        return res
          .status(403)
          .json({ success: false, message: 'Only candidates can view their applications' });

      const application = await ApplicationService.getCandidateApplication(
        req.params.id,
        candidate.id
      );
      res.json({ success: true, data: application });
    } catch (error) {
      next(error);
    }
  }

  async getMyApplicationHistory(req, res, next) {
    try {
      const candidate = await CandidateRepository.findByUserId(req.user.id);
      if (!candidate)
        return res
          .status(403)
          .json({ success: false, message: 'Only candidates can view application history' });

      const history = await ApplicationService.getCandidateApplicationHistory(
        req.params.id,
        candidate.id
      );
      res.json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  }

  async getJobApplications(req, res, next) {
    try {
      const employer =
        req.user.role === 'admin' ? null : await EmployerRepository.findByUserId(req.user.id);
      if (req.user.role !== 'admin' && !employer)
        return res
          .status(403)
          .json({ success: false, message: 'Only employers can view job applications' });

      const applications = await ApplicationService.getJobApplications(
        req.params.jobId,
        employer?.id,
        req.user.role === 'admin'
      );
      res.json({ success: true, data: applications });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const employer =
        req.user.role === 'admin' ? null : await EmployerRepository.findByUserId(req.user.id);
      if (req.user.role !== 'admin' && !employer)
        return res
          .status(403)
          .json({ success: false, message: 'Only employers can update status' });

      await ApplicationService.updateApplicationStatus(
        req.params.id,
        employer?.id,
        req.user.id,
        req.body.status,
        req.body.notes,
        req.user.role === 'admin',
        req.body
      );
      res.json({ success: true, message: 'Status updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async addNote(req, res, next) {
    try {
      const employer =
        req.user.role === 'admin' ? null : await EmployerRepository.findByUserId(req.user.id);
      if (req.user.role !== 'admin' && !employer)
        return res.status(403).json({ success: false, message: 'Only employers can add notes' });

      const note = await ApplicationService.addApplicationNote(
        req.params.id,
        employer?.id,
        req.user.id,
        req.body.notes,
        req.user.role === 'admin'
      );

      res.status(201).json({ success: true, data: note, message: 'Note added successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req, res, next) {
    try {
      const employer =
        req.user.role === 'admin' ? null : await EmployerRepository.findByUserId(req.user.id);
      if (req.user.role !== 'admin' && !employer)
        return res.status(403).json({ success: false, message: 'Unauthorized' });

      const history = await ApplicationService.getApplicationHistory(
        req.params.id,
        employer?.id,
        req.user.role === 'admin'
      );
      res.json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  }

  async getScreening(req, res, next) {
    try {
      const employer =
        req.user.role === 'admin' ? null : await EmployerRepository.findByUserId(req.user.id);
      if (req.user.role !== 'admin' && !employer)
        return res.status(403).json({ success: false, message: 'Unauthorized' });

      const results = await ApplicationService.getScreeningResults(
        req.params.id,
        employer?.id,
        req.user.role === 'admin'
      );
      res.json({ success: true, data: results });
    } catch (error) {
      next(error);
    }
  }

  async getApplication(req, res, next) {
    try {
      const employer =
        req.user.role === 'admin' ? null : await EmployerRepository.findByUserId(req.user.id);
      if (req.user.role !== 'admin' && !employer)
        return res
          .status(403)
          .json({ success: false, message: 'Only employers can view application details' });

      const application = await ApplicationService.getApplication(
        req.params.id,
        employer?.id,
        req.user.role === 'admin'
      );
      res.json({ success: true, data: application });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ApplicationController();
