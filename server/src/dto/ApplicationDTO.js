class ApplicationDTO {
  constructor(app) {
    this.id = app.id;
    this.candidateId = app.candidate_id;
    this.candidateName = `${app.first_name} ${app.last_name}`;
    this.candidateAvatar = app.avatar_url;
    this.jobId = app.job_id;
    this.jobTitle = app.job_title;
    this.companyName = app.company_name;
    this.companyLogo = app.company_logo;
    this.status = app.status;
    this.resumeUrl = app.resume_url;
    this.coverLetter = app.cover_letter;
    this.appliedAt = app.applied_at;
  }

  static fromApplication(app) {
    if (!app) return null;
    return new ApplicationDTO(app);
  }

  static fromApplications(apps) {
    return apps.map((app) => new ApplicationDTO(app));
  }
}

module.exports = ApplicationDTO;
