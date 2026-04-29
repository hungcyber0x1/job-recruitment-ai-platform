/**
 * Company Controller — handles company public and admin endpoints.
 *
 * ⚠️   TABLE: Sử dụng `company_profiles`
 * ⚠️   ROLE: Sử dụng 'recruiter' thay vì 'employer'
 */
const CompanyRepository = require('../models/Company');
const JobRepository = require('../models/Job');
const AdminService = require('../services/admin');
const catchAsync = require('../utils/catchAsync');
const { toJobContracts } = require('../utils/job-contract');
const { ApiResponse } = require('../utils/ApiResponse');

class CompanyController {
  getPublicCompanies = catchAsync(async (req, res) => {
    const { search, industry, page = 1, limit } = req.query;
    const parsedPage = parseInt(page, 10);
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    const offset =
      Number.isFinite(parsedLimit) && parsedLimit > 0 ? (parsedPage - 1) * parsedLimit : undefined;

    const { data: companies, total } = await CompanyRepository.findPublicWithFilters({
      search,
      industry,
      limit: parsedLimit,
      offset,
    });

    return ApiResponse.success(res, companies, {
      pagination: Number.isFinite(parsedLimit) && parsedLimit > 0
        ? { page: parsedPage, limit: parsedLimit, total, pages: Math.ceil(total / parsedLimit) }
        : { total }
    });
  });

  getPublicCompanyById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const company = await CompanyRepository.findPublicById(id);

    if (!company) {
      return ApiResponse.notFound(res, 'Company');
    }

    // Public listing: chỉ hiển thị jobs đang published và chưa hết hạn
    // Không truyền status filter để dùng logic mặc định trong findWithDetails
    const { data: jobs } = await JobRepository.findWithDetails({
      company_id: id,
    });

    return ApiResponse.success(res, {
      ...company,
      jobs: toJobContracts(jobs),
    });
  });

  getAllCompanies = catchAsync(async (req, res) => {
    const { search, industry, is_verified, flagged, page = 1, limit = 10, include_deleted } = req.query;
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);
    const offset = (parsedPage - 1) * parsedLimit;

    const { data: companies, total } = await CompanyRepository.findAllWithFilters({
      search,
      industry,
      is_verified,
      flagged,
      include_deleted: include_deleted === 'true',
      limit: parsedLimit,
      offset,
    });

    const [pendingCount, flaggedCount, grandTotal] = await Promise.all([
      CompanyRepository.countByVerification(false),
      CompanyRepository.countFlagged(),
      CompanyRepository.countWithFilters({}),
    ]);

    return ApiResponse.success(res, companies, {
      pagination: { page: parsedPage, limit: parsedLimit, total, pages: Math.ceil(total / parsedLimit) },
      stats: { total: grandTotal, pending: pendingCount, flagged: flaggedCount }
    });
  });

  verifyCompany = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { is_verified, note } = req.body;

    const updated = await AdminService.verifyCompany(
      req.user.id,
      id,
      is_verified,
      note,
      req.ip,
      req.headers['user-agent']
    );

    if (!updated) {
      return ApiResponse.notFound(res, 'Company');
    }

    return ApiResponse.success(res, null, {
      message: is_verified ? 'Company verified successfully' : 'Company verification updated'
    });
  });

  deleteCompany = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await AdminService.deleteCompany(
      req.user.id,
      id,
      req.ip,
      req.headers['user-agent']
    );

    if (!result) return ApiResponse.notFound(res, 'Company');
    return ApiResponse.success(res, null, { message: 'Company soft-deleted successfully' });
  });

  restoreCompany = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await AdminService.restoreCompany(
      req.user.id,
      id,
      req.ip,
      req.headers['user-agent']
    );

    if (!result) return ApiResponse.notFound(res, 'Company');
    return ApiResponse.success(res, null, { message: 'Company restored successfully' });
  });

  flagCompany = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { flagged, note } = req.body;

    const updated = await AdminService.updateCompanyFlag(
      req.user.id,
      id,
      flagged,
      note,
      req.ip,
      req.headers['user-agent']
    );

    if (!updated) {
      return ApiResponse.notFound(res, 'Company');
    }

    return ApiResponse.success(res, null, {
      message: flagged ? 'Company flagged successfully' : 'Company flag removed'
    });
  });

  banCompany = catchAsync(async (req, res) => {
    const { id } = req.params;
    await AdminService.banCompany(
      req.user.id,
      id,
      req.ip,
      req.headers['user-agent']
    );
    return ApiResponse.success(res, null, { message: 'Đã khóa công ty và tất cả tin tuyển dụng liên quan.' });
  });

  bulkUpdateStatus = catchAsync(async (req, res) => {
    const { ids, status } = req.body;
    const count = await AdminService.bulkUpdateCompaniesStatus(
      req.user.id,
      ids,
      status,
      req.ip,
      req.headers['user-agent']
    );
    return ApiResponse.success(res, null, { message: `Updated ${count} companies successfully` });
  });
}

module.exports = new CompanyController();
