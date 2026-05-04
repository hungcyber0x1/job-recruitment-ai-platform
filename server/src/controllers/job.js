const JobService = require('../services/job');
const catchAsync = require('../utils/catchAsync');
const { toJobContract, toJobContracts } = require('../utils/job-contract');
const { ApiResponse } = require('../utils/ApiResponse');
const AppError = require('../utils/errorHandler');
const { hasCompanyPermission, resolveRecruiterCompanyContext } = require('../utils/company-access');

class JobController {
  async _getCompanyForUser(user, options = {}) {
    const { allowMissing = false } = options;
    const company = await resolveRecruiterCompanyContext(user);
    if (!company) {
      if (allowMissing) {
        return null;
      }
      throw new AppError('Company profile not found', 404);
    }
    return company;
  }

  getJobs = catchAsync(async (req, res) => {
    const filters = {
      category_id: req.query.category_id,
      job_type: req.query.type || req.query.job_type,
      search: req.query.search,
      location: req.query.location,
      limit: req.query.limit,
      offset: req.query.offset,
      status: req.query.status,
      publicOnly: true,
    };

    const { data: jobs, total } = await JobService.getAllJobs(filters);
    const safeJobs = Array.isArray(jobs) ? jobs : [];
    return ApiResponse.success(res, toJobContracts(safeJobs), {
      pagination: { total: typeof total === 'number' ? total : 0 },
    });
  });

  getRecentInterestedJobs = catchAsync(async (req, res) => {
    const filters = {
      category_id: req.query.category_id,
      job_type: req.query.type || req.query.job_type,
      search: req.query.search,
      location: req.query.location,
      limit: req.query.limit,
      offset: req.query.offset,
      publicOnly: true,
    };

    const { data: jobs, total } = await JobService.getRecentInterestedJobs(filters);
    const safeJobs = Array.isArray(jobs) ? jobs : [];
    return ApiResponse.success(res, toJobContracts(safeJobs), {
      pagination: { total: typeof total === 'number' ? total : 0 },
    });
  });

  getJob = catchAsync(async (req, res) => {
    const job = await JobService.getJobById(req.params.id, { publicOnly: true });
    return ApiResponse.success(res, toJobContract(job));
  });

  getMyJobs = catchAsync(async (req, res) => {
    const company = await this._getCompanyForUser(req.user, { allowMissing: true });
    if (!company) {
      return ApiResponse.success(res, [], {
        message: 'No company profile linked to this account yet',
      });
    }

    const jobs = await JobService.getJobsByCompany(company.id);
    return ApiResponse.success(res, toJobContracts(jobs));
  });

  createJob = catchAsync(async (req, res) => {
    const company = await this._getCompanyForUser(req.user);
    if (!hasCompanyPermission(req.user, 'can_post_job')) {
      return ApiResponse.forbidden(res, 'You do not have permission to create jobs');
    }

    if (company.flagged) {
      return ApiResponse.forbidden(
        res,
        'Hồ sơ doanh nghiệp đang bị gắn cờ kiểm duyệt, không thể đăng tin mới'
      );
    }

    const result = await JobService.createJob(company.id, req.user.id, req.body);
    return ApiResponse.created(res, result);
  });

  updateJob = catchAsync(async (req, res) => {
    const company = await this._getCompanyForUser(req.user);
    const job = await JobService.getJobById(req.params.id, { allowDeleted: true });

    if (job.company_id !== company.id && req.user.role !== 'admin') {
      return ApiResponse.forbidden(res, 'Forbidden');
    }

    if (!hasCompanyPermission(req.user, 'can_edit_job') && req.user.role !== 'admin') {
      return ApiResponse.forbidden(res, 'You do not have permission to update jobs');
    }

    const result = await JobService.updateJob(req.params.id, req.body, {
      companyId: company.id,
      recruiterId: req.user.id,
    });
    return ApiResponse.success(res, result, { message: 'Job updated' });
  });

  deleteJob = catchAsync(async (req, res) => {
    const company = await this._getCompanyForUser(req.user);
    const job = await JobService.getJobById(req.params.id, { allowDeleted: true });

    if (job.company_id !== company.id && req.user.role !== 'admin') {
      return ApiResponse.forbidden(res, 'Forbidden');
    }

    if (!hasCompanyPermission(req.user, 'can_delete_job') && req.user.role !== 'admin') {
      return ApiResponse.forbidden(res, 'You do not have permission to delete jobs');
    }

    await JobService.deleteJob(req.params.id);
    return ApiResponse.noContent(res);
  });
}

module.exports = new JobController();
