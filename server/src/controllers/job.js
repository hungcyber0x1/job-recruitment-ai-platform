const JobService = require('../services/job');
const { pool } = require('../config/database.config');

/** Client (JobCard) dùng salary_range; DB có salary_min/max */
function formatSalaryRange(job) {
  if (!job) return job;
  if (job.salary_range) return job;
  const min = job.salary_min;
  const max = job.salary_max;
  const fmt = (n) => {
    if (n == null) return '';
    const v = Number(n);
    if (v >= 1000000) return `${Math.round(v / 1000000)} triệu`;
    return `${v.toLocaleString('vi-VN')} đ`;
  };
  let salary_range = 'Thỏa thuận';
  if (min != null && max != null) salary_range = `${fmt(min)} – ${fmt(max)} / tháng`;
  else if (min != null) salary_range = `Từ ${fmt(min)} / tháng`;
  else if (max != null) salary_range = `Đến ${fmt(max)} / tháng`;
  return { ...job, salary_range, skills: Array.isArray(job.skills) ? job.skills : [] };
}

class JobController {
  /**
   * Helper to get employer id from user id
   * (Temporary until employer-service is ready)
   */
  async _getEmployerId(userId) {
    const [rows] = await pool.query('SELECT id FROM employers WHERE user_id = ?', [userId]);
    if (!rows[0]) {
      const error = new Error('Employer profile not found');
      error.statusCode = 404;
      throw error;
    }
    return rows[0].id;
  }

  async getJobs(req, res, next) {
    try {
      const filters = {
        category_id: req.query.category_id,
        type: req.query.type,
        search: req.query.search,
        location: req.query.location,
        limit: req.query.limit,
        offset: req.query.offset,
        status: req.query.status,
      };
      const { data: jobs, total } = await JobService.getAllJobs(filters);
      const data = Array.isArray(jobs) ? jobs.map(formatSalaryRange) : jobs;
      res.json({ success: true, data, total });
    } catch (error) {
      next(error);
    }
  }

  async getJob(req, res, next) {
    try {
      const job = await JobService.getJobById(req.params.id);
      res.json({ success: true, data: formatSalaryRange(job) });
    } catch (error) {
      next(error);
    }
  }

  async getMyJobs(req, res, next) {
    try {
      const employerId = await this._getEmployerId(req.user.id);
      const jobs = await JobService.getJobsByEmployer(employerId);
      res.json({ success: true, data: jobs });
    } catch (error) {
      next(error);
    }
  }

  async createJob(req, res, next) {
    try {
      const employerId = await this._getEmployerId(req.user.id);
      const jobId = await JobService.createJob(employerId, req.body);
      res.status(201).json({ success: true, data: { id: jobId } });
    } catch (error) {
      next(error);
    }
  }

  async updateJob(req, res, next) {
    try {
      const employerId = await this._getEmployerId(req.user.id);
      // Verify ownership
      const job = await JobService.getJobById(req.params.id, { allowDeleted: true });
      if (job.employer_id !== employerId && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
      await JobService.updateJob(req.params.id, req.body);
      res.json({ success: true, message: 'Job updated' });
    } catch (error) {
      next(error);
    }
  }

  async deleteJob(req, res, next) {
    try {
      const employerId = await this._getEmployerId(req.user.id);
      const job = await JobService.getJobById(req.params.id, { allowDeleted: true });
      if (job.employer_id !== employerId && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
      await JobService.deleteJob(req.params.id);
      res.json({ success: true, message: 'Job deleted' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new JobController();
