/**
 * Employer Controller — handles employer/recruiter-specific HTTP requests.
 *
 * ⚠️   TABLE: Sử dụng `company_profiles`
 * ⚠️   ROLE: Sử dụng 'recruiter' thay vì 'employer'
 */
const EmployerService = require('../services/employer');
const { ApiResponse } = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');

class EmployerController {
  getProfile = catchAsync(async (req, res) => {
    const profile = await EmployerService.getProfile(req.user.id);
    return ApiResponse.success(res, profile);
  });

  updateProfile = catchAsync(async (req, res) => {
    const profile = await EmployerService.updateProfile(req.user.id, req.body);
    return ApiResponse.success(res, profile);
  });

  uploadLogo = catchAsync(async (req, res) => {
    if (!req.file) {
      return ApiResponse.error(res, 400, 'No file uploaded');
    }
    const logoUrl = `/uploads/company-logos/${req.file.filename}`;
    const profile = await EmployerService.updateProfile(req.user.id, { company_logo: logoUrl });
    return ApiResponse.success(res, profile, { message: 'Logo uploaded successfully' });
  });

  searchCandidates = catchAsync(async (req, res) => {
    const result = await EmployerService.searchCandidates(req.user.id, req.query);
    return ApiResponse.success(res, result.data, {
      pagination: result.pagination,
      stats: result.stats,
    });
  });

  getTalentPool = catchAsync(async (req, res) => {
    const result = await EmployerService.getTalentPool(req.user.id, req.query);
    return ApiResponse.success(res, result.data, {
      pagination: result.pagination,
      stats: result.stats,
    });
  });

  saveCandidate = catchAsync(async (req, res) => {
    const result = await EmployerService.saveCandidate(
      req.user.id,
      req.params.candidateId,
      req.body
    );
    return ApiResponse.success(res, result, { message: 'Candidate saved to talent pool' });
  });

  updateSavedCandidate = catchAsync(async (req, res) => {
    const result = await EmployerService.updateSavedCandidate(
      req.user.id,
      req.params.candidateId,
      req.body
    );
    return ApiResponse.success(res, result, { message: 'Saved candidate updated' });
  });

  removeSavedCandidate = catchAsync(async (req, res) => {
    const result = await EmployerService.removeSavedCandidate(req.user.id, req.params.candidateId);
    return ApiResponse.success(res, result, { message: 'Candidate removed from talent pool' });
  });
}

module.exports = new EmployerController();
