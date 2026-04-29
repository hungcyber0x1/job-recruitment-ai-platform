const isTruthyFlag = (value) =>
  value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true';
const { localizeJobTitle } = require('./job-title-localization');

class JobDTO {
  constructor(job) {
    this.id = job.id;
    this.title = localizeJobTitle(job.title);
    this.rawTitle = job.title;
    this.companyName = job.company_name;
    this.companyLogo = job.company_logo;
    this.category = job.category_name;
    this.location = job.location;
    this.address = job.address;
    this.type = job.type;
    this.salary = {
      min: job.salary_min,
      max: job.salary_max,
      negotiable: isTruthyFlag(job.salary_negotiable),
    };
    this.vacancies = job.vacancies ?? 1;
    this.description = job.description;
    this.requirements = job.requirements;
    this.benefits = job.benefits;
    this.status = job.status;
    this.deadline = job.deadline;
    this.expiresAt = job.expires_at || job.deadline;
    this.createdAt = job.created_at;
    this.applicantCount = job.applicant_count || 0;
  }

  static fromJob(job) {
    if (!job) return null;
    return new JobDTO(job);
  }

  static fromJobs(jobs) {
    return jobs.map((job) => new JobDTO(job));
  }
}

module.exports = JobDTO;
