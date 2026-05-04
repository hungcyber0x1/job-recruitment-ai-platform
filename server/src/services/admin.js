/**
 * Admin Service — business logic for all admin operations.
 * Handles dashboard stats, user management, job moderation, and system tasks.
 *
 * Stats cover 6 Admin Blocks:
 * A. Người dùng & Phân quyền
 * B. Doanh nghiệp & Tuyển dụng
 * C. Nội dung Public
 * D. Taxonomy dữ liệu
 * E. AI & Chất lượng dữ liệu
 * F. Báo cáo & Vận hành
 */
const { pool } = require('../config/database.config');
const JobRepository = require('../models/Job');
const UserRepository = require('../models/User');
const ApplicationRepository = require('../models/Application');
const ActivityLogRepository = require('../models/ActivityLog');
const SupportTicketRepository = require('../models/SupportTicket');
const CompanyRepository = require('../models/Company');
const BlogRepository = require('../models/Blog');
const SkillRepository = require('../models/Skill');
const JobService = require('./job');
const ApplicationService = require('./application');
const AppError = require('../utils/errorHandler');
const bcrypt = require('bcryptjs');
const {
  APP_STATUS,
  APP_STATUS_VALUES,
  JOB_STATUS,
  JOB_STATUS_VALUES,
  ROLE_VALUES,
  USER_STATUS,
  USER_STATUS_VALUES,
} = require('../utils/constants');
const { normalizeAdminPermissions } = require('../utils/admin-permissions');

function normalizeRole(role) {
  return String(role ?? '')
    .trim()
    .toLowerCase();
}

function normalizeOptionalText(value) {
  const text = String(value ?? '').trim();
  return text.length ? text : null;
}

function parseOptionalCurrency(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value : null;

  const numericText = String(value).replace(/[^\d.-]/g, '');
  if (!numericText) return null;

  const parsed = Number(numericText);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function normalizeAdminApplicationMetadata(status, metadata = {}) {
  const normalized = { ...(metadata || {}) };

  if (status === APP_STATUS.OFFERED) {
    const offerDetails = metadata?.offer_details || metadata?.offerDetails || metadata?.offer || {};
    const source =
      offerDetails && typeof offerDetails === 'object'
        ? { ...normalized, ...offerDetails }
        : normalized;

    return {
      salary_offered: parseOptionalCurrency(source.salary_offered ?? source.salary ?? null),
      salary_currency: source.salary_currency || 'VND',
      response_deadline: source.response_deadline ?? source.responseDeadline ?? null,
      start_date: source.start_date ?? source.startDate ?? null,
      benefits: normalizeOptionalText(source.benefits),
      offer_notes: normalizeOptionalText(source.offer_notes ?? source.notes),
      offer_letter_url: normalizeOptionalText(source.offer_letter_url),
    };
  }

  return normalized;
}

function parseModerationBoolean(value, fieldName) {
  if (value === true || value === 1 || value === '1' || value === 'true') return true;
  if (value === false || value === 0 || value === '0' || value === 'false') return false;
  throw new AppError(`${fieldName} không hợp lệ`, 400);
}

const OPTIONAL_SCHEMA_ERROR_CODES = new Set([
  'ER_NO_SUCH_TABLE',
  'ER_BAD_TABLE_ERROR',
  'ER_BAD_FIELD_ERROR',
]);

function toIdList(rows, key = 'id') {
  if (!Array.isArray(rows)) return [];
  return [
    ...new Set(
      rows.map((row) => Number.parseInt(row?.[key], 10)).filter((id) => Number.isFinite(id))
    ),
  ];
}

function affectedRows(result) {
  return Number(result?.affectedRows || 0);
}

async function safeQuery(connection, sql, params = []) {
  try {
    const [result] = await connection.query(sql, params);
    return result;
  } catch (error) {
    if (OPTIONAL_SCHEMA_ERROR_CODES.has(error?.code)) {
      return null;
    }
    throw error;
  }
}

async function selectIds(connection, sql, params = [], key = 'id') {
  return toIdList(await safeQuery(connection, sql, params), key);
}

async function runMutation(connection, sql, params = []) {
  return affectedRows(await safeQuery(connection, sql, params));
}

async function runMutationForIds(connection, ids, sql, params = []) {
  if (!ids.length) return 0;
  return runMutation(connection, sql, [...params, ids]);
}

function addCount(summary, key, count) {
  summary[key] = (summary[key] || 0) + Number(count || 0);
}

function formatCascadeSummary(summary) {
  const labels = [
    ['jobs', 'jobs'],
    ['companies', 'companies'],
    ['blogs', 'blogs'],
    ['companyMembers', 'company members'],
    ['applications', 'applications withdrawn'],
    ['jobAlerts', 'job alerts'],
    ['savedJobs', 'saved jobs'],
    ['savedCompanies', 'saved companies'],
    ['notifications', 'notifications'],
    ['conversations', 'chat sessions'],
  ];

  const parts = labels
    .map(([key, label]) => [Number(summary[key] || 0), label])
    .filter(([count]) => count > 0)
    .map(([count, label]) => `${count} ${label}`);

  return parts.length ? parts.join(', ') : 'no owned records';
}

async function getActorAdmin(adminId) {
  const actor = await UserRepository.findById(adminId);
  if (!actor || normalizeRole(actor.role) !== 'admin') {
    throw new AppError('Admin account not found', 403);
  }
  return actor;
}

async function assertAdminActor(adminId) {
  return getActorAdmin(adminId);
}

async function assertCanManageTargetAdmin(adminId, targetUser) {
  if (!targetUser || normalizeRole(targetUser.role) !== 'admin') return;
  await assertAdminActor(adminId);
}

async function assertCanManageTargetIds(adminId, targetIds) {
  const ids = targetIds.map((id) => Number.parseInt(id, 10)).filter((id) => Number.isFinite(id));
  if (!ids.length) return;
  await assertAdminActor(adminId);
}

const ANALYTICS_RANGES = {
  '7d': { id: '7d', days: 7, label: '7 ngày gần nhất' },
  '30d': { id: '30d', days: 30, label: '30 ngày gần nhất' },
  '3m': { id: '3m', days: 90, label: '3 tháng gần nhất' },
};

function normalizeAnalyticsRange(range) {
  const key = String(range || '30d')
    .trim()
    .toLowerCase();
  return ANALYTICS_RANGES[key] || ANALYTICS_RANGES['30d'];
}

function buildAnalyticsDateSequence(days) {
  return Array.from({ length: days }, (_, index) => `SELECT ${index} AS n`).join(' UNION ALL ');
}

function toNumber(value) {
  return Number(value || 0);
}

function formatViNumber(value) {
  return toNumber(value).toLocaleString('vi-VN');
}

function buildAnalyticsInsights(dashboard) {
  const { kpi, pipeline, topIndustries, moderation, range } = dashboard;
  const applications = toNumber(kpi.applications);
  const hired = toNumber(pipeline.hired);
  const rejected = toNumber(pipeline.rejected);
  const interview = toNumber(pipeline.interview);
  const pendingJobs = toNumber(moderation.pendingJobs);
  const pendingCompanies = toNumber(moderation.pendingCompanies);
  const topIndustry = Array.isArray(topIndustries) ? topIndustries[0] : null;
  const insights = [];

  if (applications >= 5 && hired === 0) {
    insights.push({
      id: 'applications-without-hire',
      tone: 'danger',
      title: 'Ứng tuyển đã phát sinh nhưng chưa có tuyển thành công',
      description: `${formatViNumber(applications)} lượt ứng tuyển trong ${range.label}, chưa ghi nhận hồ sơ được tuyển. Admin nên theo dõi tốc độ xử lý pipeline cùng nhà tuyển dụng.`,
    });
  } else if (applications >= 20 && applications > Math.max(1, hired) * 8) {
    insights.push({
      id: 'hiring-output-low',
      tone: 'warning',
      title: 'Ứng tuyển cao nhưng kết quả tuyển còn thấp',
      description: `${formatViNumber(applications)} lượt ứng tuyển đang tạo tải cho hệ thống, trong khi mới có ${formatViNumber(hired)} hồ sơ được tuyển.`,
    });
  } else if (hired > 0) {
    insights.push({
      id: 'hiring-output-positive',
      tone: 'success',
      title: 'Pipeline đã ghi nhận tuyển thành công',
      description: `${formatViNumber(hired)} hồ sơ đã đi đến trạng thái tuyển trong ${range.label}. Đây là tín hiệu tích cực về chất lượng luồng tuyển dụng.`,
    });
  }

  if (topIndustry && toNumber(topIndustry.count) > 0) {
    insights.push({
      id: 'top-industry',
      tone: 'info',
      title: `Ngành ${topIndustry.name} đang nổi bật`,
      description: `${formatViNumber(topIndustry.count)} tin tuyển dụng thuộc nhóm ngành này trong ${range.label}, cao nhất trong dữ liệu hiện tại.`,
    });
  }

  if (pendingJobs > 0) {
    insights.push({
      id: 'pending-jobs',
      tone: pendingJobs >= 10 ? 'warning' : 'info',
      title: 'Có tin tuyển dụng đang chờ duyệt',
      description: `${formatViNumber(pendingJobs)} tin tuyển dụng cần được kiểm duyệt để không làm chậm nguồn cung việc làm mới.`,
    });
  }

  if (pendingCompanies > 0) {
    insights.push({
      id: 'pending-companies',
      tone: pendingCompanies >= 5 ? 'warning' : 'info',
      title: 'Có doanh nghiệp chưa xác minh',
      description: `${formatViNumber(pendingCompanies)} doanh nghiệp mới chưa được xác minh trong ${range.label}; dữ liệu này ảnh hưởng tới khả năng đăng tin hợp lệ.`,
    });
  }

  if (rejected > interview && rejected >= 5) {
    insights.push({
      id: 'rejection-pressure',
      tone: 'warning',
      title: 'Số hồ sơ bị từ chối đang vượt nhóm phỏng vấn',
      description: `${formatViNumber(rejected)} hồ sơ bị từ chối so với ${formatViNumber(interview)} hồ sơ ở giai đoạn phỏng vấn. Nên rà chất lượng matching giữa ứng viên và tin tuyển dụng.`,
    });
  }

  if (!insights.length) {
    insights.push({
      id: 'no-activity',
      tone: 'neutral',
      title: 'Chưa có tín hiệu đủ lớn để kết luận',
      description: `Dữ liệu trong ${range.label} còn ít. Dashboard sẽ tự tạo nhận định khi có thêm người dùng, tin tuyển dụng hoặc ứng tuyển mới.`,
    });
  }

  return insights.slice(0, 4);
}

function buildAnalyticsAiSummary(insights, dashboard) {
  const priorityInsight =
    insights.find((item) => item.tone === 'danger' || item.tone === 'warning') || insights[0];
  const topIndustry = dashboard.topIndustries?.[0];

  return {
    title: priorityInsight?.title || 'Chưa đủ dữ liệu để tạo AI Insight',
    description:
      priorityInsight?.description || 'Hệ thống sẽ tự động tổng hợp khi có dữ liệu vận hành mới.',
    tone: priorityInsight?.tone || 'neutral',
    context: topIndustry
      ? `Ngành nổi bật: ${topIndustry.name} với ${formatViNumber(topIndustry.count)} tin tuyển dụng.`
      : 'Chưa xác định ngành nổi bật trong khoảng thời gian này.',
  };
}

class AdminService {
  async getAnalyticsDashboard({ range = '30d' } = {}) {
    const rangeMeta = normalizeAnalyticsRange(range);
    const rangeStartSql = `DATE_SUB(CURDATE(), INTERVAL ${rangeMeta.days - 1} DAY)`;
    const dateSequence = buildAnalyticsDateSequence(rangeMeta.days);

    const [[kpiRows], [pipelineRows], [growthRows], [topIndustryRows], [moderationRows]] =
      await Promise.all([
        pool.query(`
        SELECT
          (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL AND created_at >= ${rangeStartSql}) AS users,
          (SELECT COUNT(*) FROM jobs WHERE deleted_at IS NULL AND created_at >= ${rangeStartSql}) AS jobs,
          (SELECT COUNT(*) FROM applications WHERE created_at >= ${rangeStartSql}) AS applications,
          (SELECT COUNT(*) FROM company_profiles WHERE deleted_at IS NULL AND created_at >= ${rangeStartSql}) AS companies
      `),
        pool.query(`
        SELECT status, COUNT(*) AS count
        FROM applications
        WHERE created_at >= ${rangeStartSql}
        GROUP BY status
      `),
        pool.query(`
        SELECT
          DATE_FORMAT(d.day, '%Y-%m-%d') AS date,
          DATE_FORMAT(d.day, '%d/%m') AS label,
          COUNT(DISTINCT u.id) AS users,
          COUNT(DISTINCT a.id) AS applications
        FROM (
          SELECT DATE_SUB(CURDATE(), INTERVAL seq.n DAY) AS day
          FROM (${dateSequence}) seq
        ) d
        LEFT JOIN users u
          ON DATE(u.created_at) = d.day
         AND u.deleted_at IS NULL
        LEFT JOIN applications a
          ON DATE(a.created_at) = d.day
        GROUP BY d.day
        ORDER BY d.day ASC
      `),
        pool.query(`
        SELECT
          industry_name AS name,
          COUNT(DISTINCT job_id) AS count
        FROM (
          SELECT
            j.id AS job_id,
            COALESCE(NULLIF(c.name, ''), NULLIF(cp.industry, ''), 'Chưa phân loại') AS industry_name
          FROM jobs j
          LEFT JOIN categories c ON j.category_id = c.id
          LEFT JOIN company_profiles cp ON j.company_id = cp.id
          WHERE j.deleted_at IS NULL
            AND j.created_at >= ${rangeStartSql}
            AND (cp.deleted_at IS NULL OR cp.id IS NULL)
        ) industry_jobs
        GROUP BY industry_name
        HAVING COUNT(DISTINCT job_id) > 0
        ORDER BY count DESC, name ASC
        LIMIT 5
      `),
        pool.query(`
        SELECT
          (SELECT COUNT(*) FROM jobs
             WHERE deleted_at IS NULL
               AND status IN ('pending_review', 'pending')
               AND created_at >= ${rangeStartSql}) AS pendingJobs,
          (SELECT COUNT(*) FROM company_profiles
             WHERE deleted_at IS NULL
               AND is_verified = 0
               AND created_at >= ${rangeStartSql}) AS pendingCompanies
      `),
      ]);

    const kpiSource = kpiRows?.[0] || {};
    const moderationSource = moderationRows?.[0] || {};
    const statusCounts = (pipelineRows || []).reduce((summary, row) => {
      summary[row.status] = toNumber(row.count);
      return summary;
    }, {});

    const kpi = {
      users: toNumber(kpiSource.users),
      jobs: toNumber(kpiSource.jobs),
      applications: toNumber(kpiSource.applications),
      companies: toNumber(kpiSource.companies),
    };

    const pipeline = {
      applied: toNumber(statusCounts[APP_STATUS.SUBMITTED]),
      interview:
        toNumber(statusCounts[APP_STATUS.INTERVIEW_SCHEDULED]) +
        toNumber(statusCounts[APP_STATUS.INTERVIEWED]),
      hired: toNumber(statusCounts[APP_STATUS.HIRED]),
      rejected: toNumber(statusCounts[APP_STATUS.REJECTED]),
      sourceStatuses: {
        applied: [APP_STATUS.SUBMITTED],
        interview: [APP_STATUS.INTERVIEW_SCHEDULED, APP_STATUS.INTERVIEWED],
        hired: [APP_STATUS.HIRED],
        rejected: [APP_STATUS.REJECTED],
      },
    };

    const dashboard = {
      range: rangeMeta,
      kpi,
      pipeline,
      growth: (growthRows || []).map((row) => ({
        date: row.date,
        label: row.label,
        users: toNumber(row.users),
        applications: toNumber(row.applications),
      })),
      topIndustries: (topIndustryRows || []).map((row) => ({
        name: row.name || 'Chưa phân loại',
        count: toNumber(row.count),
        source: 'jobs',
      })),
      moderation: {
        pendingJobs: toNumber(moderationSource.pendingJobs),
        pendingCompanies: toNumber(moderationSource.pendingCompanies),
      },
    };

    const insights = buildAnalyticsInsights(dashboard);

    return {
      ...dashboard,
      insights,
      aiInsight: buildAnalyticsAiSummary(insights, dashboard),
    };
  }

  async getDashboardStats() {
    const [
      usersCount,
      jobsCount,
      applicationsCount,
      openTickets,
      pendingJobs,
      flaggedJobs,
      companyTotal,
      verifiedCompanies,
      pendingCompanyApprovals,
      rejectedCompanies,
      flaggedCompanies,
      lockedCompanies,
      applicationsByStatus,
      blogPostsTotal,
      pendingBlogs,
      flaggedBlogs,
      // Block A: User distribution
      userByRole,
      lockedAccounts,
      // Block B: Recruitment stats
      jobsByStatus,
      // Block D: Taxonomy
      skillCount,
      industryCount,
      locationCount,
    ] = await Promise.all([
      UserRepository.countAll(),
      JobRepository.countAll(),
      ApplicationRepository.countAll(),
      SupportTicketRepository.countByStatus('open'),
      JobRepository.countByStatus('pending_review'),
      JobRepository.countFlagged(),
      CompanyRepository.countWithFilters({}),
      CompanyRepository.countByModerationStatus('approved'),
      CompanyRepository.countByModerationStatus('pending'),
      CompanyRepository.countByModerationStatus('rejected'),
      CompanyRepository.countByModerationStatus('flagged'),
      CompanyRepository.countByModerationStatus('locked'),
      ApplicationRepository.countByStatus(),
      BlogRepository.countAll(),
      BlogRepository.countByStatus('pending'),
      BlogRepository.countFlagged(),
      // A: Users by role
      pool.query(
        `SELECT role, COUNT(*) as count FROM users WHERE deleted_at IS NULL GROUP BY role`
      ),
      // A: Locked accounts
      pool.query(
        `SELECT COUNT(*) as total FROM users WHERE (status = 'suspended' OR status = 'banned' OR locked_at IS NOT NULL) AND deleted_at IS NULL`
      ),
      // B: Jobs by status
      pool.query(`SELECT status, COUNT(*) as count FROM jobs GROUP BY status`),
      // D: Skill count
      SkillRepository?.countAll ? SkillRepository.countAll() : Promise.resolve(0),
      // D: Industry/category count
      pool.query(`SELECT COUNT(*) as total FROM categories`),
      // D: Location count (from jobs)
      pool.query(
        `SELECT COUNT(DISTINCT location_id) as total FROM jobs WHERE location_id IS NOT NULL`
      ),
    ]);

    // Parse user by role array
    const roleRows = userByRole[0] || [];
    let candidateCount = 0,
      recruiterCount = 0,
      adminCount = 0;
    for (const row of roleRows) {
      const count = Number(row.count || 0);
      if (row.role === 'candidate') candidateCount += count;
      else if (row.role === 'recruiter') recruiterCount += count;
      else if (row.role === 'admin') adminCount += count;
    }

    // Parse jobs by status
    const jobStatusRows = jobsByStatus[0] || [];
    const jobStatusCounts = {};
    for (const row of jobStatusRows) {
      jobStatusCounts[row.status] = Number(row.count);
    }

    const publishedJobs = jobStatusCounts.published || 0;
    const totalSkills = Number(skillCount || 0);
    const totalIndustries = Number(industryCount?.[0]?.[0]?.total || 0);
    const totalLocations = Number(locationCount?.[0]?.[0]?.total || 0);

    // Top skills query (Block D) based on current job demand.
    let topSkills = [];
    try {
      const [skillRows] = await pool.query(`
        SELECT s.name, COUNT(js.job_id) as count
        FROM skills s
        JOIN job_skills js ON js.skill_id = s.id
        JOIN jobs j ON j.id = js.job_id AND j.deleted_at IS NULL
        GROUP BY s.id, s.name
        ORDER BY count DESC, s.name ASC
        LIMIT 8
      `);
      topSkills = skillRows.map((r) => ({ name: r.name, count: Number(r.count) }));
    } catch {
      /* graceful fallback */
    }

    // Top industries/categories query based on recruitment demand.
    let topIndustries = [];
    try {
      const [indRows] = await pool.query(`
        SELECT c.name, COUNT(j.id) as count
        FROM categories c
        JOIN jobs j ON j.category_id = c.id AND j.deleted_at IS NULL
        GROUP BY c.id, c.name
        HAVING count > 0
        ORDER BY count DESC, c.name ASC
        LIMIT 6
      `);
      topIndustries = indRows.map((r) => ({ name: r.name, count: Number(r.count) }));
    } catch {
      /* graceful fallback */
    }

    // Top locations query
    let topLocations = [];
    try {
      const [locRows] = await pool.query(`
        SELECT location as name, COUNT(*) as count
        FROM jobs
        WHERE location IS NOT NULL AND location != ''
        GROUP BY location
        ORDER BY count DESC
        LIMIT 6
      `);
      topLocations = locRows.map((r) => ({ name: r.name, count: Number(r.count) }));
    } catch {
      /* graceful fallback */
    }

    // Pipeline: map application statuses, including legacy values still present in older data.
    const apps = applicationsByStatus || {};
    const totalApps = Number(applicationsCount || 0);
    const submittedCount = Number(apps.submitted || apps.pending || 0);
    const screeningCount = Number(apps.screening || 0);
    const shortlistedCount = Number(apps.shortlisted || apps.reviewed || 0);
    const inReviewCount = screeningCount + shortlistedCount;
    const interviewScheduledCount = Number(apps.interview_scheduled || apps.interviewing || 0);
    const interviewedCount = Number(apps.interviewed || 0);
    const offeredCount = Number(apps.offered || apps.accepted || 0);
    const interviewCount = interviewScheduledCount + interviewedCount + offeredCount;
    const hiredCount = Number(apps.hired || 0);
    const rejectedCount = Number(apps.rejected || 0);
    const withdrawnCount = Number(apps.withdrawn || 0);
    const activePipelineTotal =
      totalApps ||
      submittedCount + inReviewCount + interviewCount + hiredCount + rejectedCount + withdrawnCount;

    return {
      // A. Người dùng & Phân quyền
      users: usersCount,
      userDistribution: roleRows.map((r) => ({ role: r.role, count: Number(r.count) })),
      candidateAccounts: candidateCount,
      recruiterAccounts: recruiterCount,
      adminAccounts: adminCount,
      lockedAccounts: Number(lockedAccounts[0]?.[0]?.total || 0),

      // B. Doanh nghiệp & Tuyển dụng
      companies: Number(companyTotal || 0),
      verifiedCompanies: Number(verifiedCompanies || 0),
      unverifiedCompanies: Number(pendingCompanyApprovals || 0),
      pendingCompanyApprovals: Number(pendingCompanyApprovals || 0),
      rejectedCompanies: Number(rejectedCompanies || 0),
      flaggedCompanies: Number(flaggedCompanies || 0),
      lockedCompanies: Number(lockedCompanies || 0),
      jobs: Number(jobsCount || 0),
      publishedJobs,
      pendingJobApprovals: Number(pendingJobs || 0),
      rejectedJobs: jobStatusCounts.rejected || 0,
      closedJobs: jobStatusCounts.closed || 0,
      applications: totalApps,
      totalApplications: totalApps,
      submittedCount,
      screeningCount: inReviewCount,
      shortlistedCount,
      interviewCount,
      hiredCount,
      rejectedCount,
      withdrawnCount,
      // Pipeline counts
      pipeline: {
        submitted: submittedCount,
        screening: inReviewCount,
        shortlisted: shortlistedCount,
        interview_scheduled: interviewScheduledCount,
        interviewed: interviewedCount,
        offered: offeredCount,
        interviewing: interviewCount,
        hired: hiredCount,
        rejected: rejectedCount,
        withdrawn: withdrawnCount,
      },
      // Pipeline conversion rates
      conversion: {
        submittedToScreening:
          activePipelineTotal > 0 ? Math.round((inReviewCount / activePipelineTotal) * 100) : 0,
        submittedToShortlisted:
          activePipelineTotal > 0 ? Math.round((inReviewCount / activePipelineTotal) * 100) : 0,
        screeningToInterview:
          inReviewCount > 0 ? Math.round((interviewCount / inReviewCount) * 100) : 0,
        shortlistedToInterview:
          inReviewCount > 0 ? Math.round((interviewCount / inReviewCount) * 100) : 0,
        interviewToHired: interviewCount > 0 ? Math.round((hiredCount / interviewCount) * 100) : 0,
        submittedToHired:
          activePipelineTotal > 0 ? Math.round((hiredCount / activePipelineTotal) * 100) : 0,
      },
      // Moderation (within B)
      moderation: {
        pendingJobs,
        flaggedJobs,
        unverifiedCompanies: Number(pendingCompanyApprovals || 0),
        pendingCompanyApprovals: Number(pendingCompanyApprovals || 0),
        rejectedCompanies: Number(rejectedCompanies || 0),
        flaggedCompanies: Number(flaggedCompanies || 0),
        lockedCompanies: Number(lockedCompanies || 0),
        pendingBlogs,
        flaggedBlogs,
      },

      // C. Nội dung Public
      blogPosts: Number(blogPostsTotal || 0),
      homepageBanners: 0,

      // D. Taxonomy dữ liệu
      totalCategories: totalIndustries,
      taxonomy: {
        totalSkills,
        totalIndustries,
        totalLocations,
      },
      topSkills,
      topIndustries,
      topLocations,

      // E. AI & Chất lượng dữ liệu
      aiStats: {
        spamDetected:
          Number(flaggedJobs || 0) + Number(flaggedCompanies || 0) + Number(flaggedBlogs || 0),
        flaggedAccounts: lockedAccounts[0]?.[0]?.total || 0,
        chatbotConversations: 0,
        cvScans: 0,
        aiAccuracyScore: 0,
      },

      // F. Báo cáo
      tickets: openTickets,
    };
  }

  async updateUserStatus(adminId, userId, status, ip, userAgent) {
    if (!USER_STATUS_VALUES.includes(status)) {
      throw new AppError(
        `Invalid user status. Must be one of: ${USER_STATUS_VALUES.join(', ')}`,
        400
      );
    }

    const user = await UserRepository.findById(userId);
    if (!user) throw new AppError('Người dùng không tồn tại', 404);

    await assertCanManageTargetAdmin(adminId, user, 'update status');

    const updated = await UserRepository.updateStatus(userId, status);

    if (updated) {
      if (
        normalizeRole(user.role) === 'recruiter' &&
        user.status === USER_STATUS.PENDING_VERIFICATION &&
        status === USER_STATUS.ACTIVE
      ) {
        try {
          const EmailService = require('./email');
          EmailService.sendAccountApprovalEmail(
            user.email,
            `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Nhà tuyển dụng'
          );
        } catch (error) {
          console.error('Lỗi khi gửi email phê duyệt:', error);
        }
      }

      await ActivityLogRepository.create({
        adminCode: adminId,
        userId: userId,
        action: 'UPDATE_USER_STATUS',
        details: `Updated user ${userId} status to ${status}`,
        ip,
        userAgent,
      });
    }

    return updated;
  }

  async updateUser(adminId, userId, data, ip, userAgent) {
    const user = await UserRepository.findById(userId);
    if (!user) throw new AppError('Người dùng không tồn tại', 404);

    await assertCanManageTargetAdmin(adminId, user, 'update details');

    const updateData = { ...data };

    if (updateData.role !== undefined) {
      updateData.role = normalizeRole(updateData.role);
      if (!ROLE_VALUES.includes(updateData.role)) {
        throw new AppError(`Invalid role. Must be one of: ${ROLE_VALUES.join(', ')}`, 400);
      }

      updateData.permissions = updateData.role === 'admin' ? JSON.stringify(['all']) : null;
    }

    const roleForPermissions = normalizeRole(updateData.role ?? user.role);
    if (updateData.permissions !== undefined && roleForPermissions !== 'admin') {
      const normalizedPermissions = normalizeAdminPermissions(updateData.permissions);
      if (normalizedPermissions.length > 0) {
        throw new AppError('Permissions can only be assigned to admin accounts', 400);
      }
      updateData.permissions = null;
    }

    if (updateData.status) {
      if (!USER_STATUS_VALUES.includes(updateData.status)) {
        throw new AppError(
          `Invalid user status. Must be one of: ${USER_STATUS_VALUES.join(', ')}`,
          400
        );
      }
    }

    if (updateData.permissions !== undefined) {
      updateData.permissions = JSON.stringify(normalizeAdminPermissions(updateData.permissions));
    }

    if (updateData.full_name) {
      const nameParts = updateData.full_name.trim().split(/\s+/);
      if (nameParts.length > 1) {
        updateData.last_name = nameParts.pop();
        updateData.first_name = nameParts.join(' ');
      } else {
        updateData.first_name = updateData.full_name;
        updateData.last_name = '';
      }
      delete updateData.full_name;
    }

    const updated = await UserRepository.updateByAdmin(userId, updateData);

    if (updated) {
      if (
        normalizeRole(user.role) === 'recruiter' &&
        user.status === USER_STATUS.PENDING_VERIFICATION &&
        updateData.status === USER_STATUS.ACTIVE
      ) {
        try {
          const EmailService = require('./email');
          EmailService.sendAccountApprovalEmail(
            user.email,
            `${updateData.first_name || user.first_name || ''} ${updateData.last_name || user.last_name || ''}`.trim() ||
              'Nhà tuyển dụng'
          );
        } catch (error) {
          console.error('Lỗi khi gửi email phê duyệt trong updateUser:', error);
        }
      }

      const changedFields = Object.keys(updateData).join(', ');
      await ActivityLogRepository.create({
        adminCode: adminId,
        userId: userId,
        action: 'UPDATE_USER_DETAILS',
        details: `Updated user ${userId} fields: ${changedFields}`,
        ip,
        userAgent,
      });
    }

    return updated;
  }

  async cascadeDeleteUserOwnedData(connection, userId) {
    const summary = {};
    const candidateIds = await selectIds(
      connection,
      'SELECT id FROM candidate_profiles WHERE user_id = ?',
      [userId]
    );
    const ownedCompanyIds = await selectIds(
      connection,
      'SELECT id FROM company_profiles WHERE user_id = ?',
      [userId]
    );
    const jobIds = await selectIds(
      connection,
      ownedCompanyIds.length
        ? `SELECT id
             FROM jobs
            WHERE deleted_at IS NULL
              AND (recruiter_id = ? OR company_id IN (?))`
        : `SELECT id
             FROM jobs
            WHERE deleted_at IS NULL
              AND recruiter_id = ?`,
      ownedCompanyIds.length ? [userId, ownedCompanyIds] : [userId]
    );

    addCount(
      summary,
      'companyMembers',
      await runMutation(
        connection,
        `UPDATE company_members
            SET status = 'inactive',
                can_post_job = 0,
                can_edit_job = 0,
                can_delete_job = 0,
                can_approve_job = 0,
                can_view_applications = 0,
                can_manage_applications = 0,
                can_send_email = 0,
                can_view_salary = 0,
                can_export_data = 0
          WHERE user_id = ?
            AND status <> 'inactive'`,
        [userId]
      )
    );

    if (jobIds.length) {
      addCount(
        summary,
        'interviews',
        await runMutationForIds(
          connection,
          jobIds,
          `DELETE is2
             FROM interview_schedules is2
             JOIN applications a ON a.id = is2.application_id
            WHERE a.job_id IN (?)`
        )
      );
      addCount(
        summary,
        'offers',
        await runMutationForIds(
          connection,
          jobIds,
          `DELETE ao
             FROM application_offers ao
             JOIN applications a ON a.id = ao.application_id
            WHERE a.job_id IN (?)`
        )
      );
      addCount(
        summary,
        'savedJobs',
        await runMutationForIds(connection, jobIds, 'DELETE FROM saved_jobs WHERE job_id IN (?)')
      );
      addCount(
        summary,
        'jobs',
        await runMutationForIds(
          connection,
          jobIds,
          `UPDATE jobs
              SET deleted_at = NOW(),
                  status = 'closed',
                  updated_at = NOW()
            WHERE id IN (?)
              AND deleted_at IS NULL`
        )
      );
    }

    if (ownedCompanyIds.length) {
      addCount(
        summary,
        'companyMembers',
        await runMutationForIds(
          connection,
          ownedCompanyIds,
          `UPDATE company_members
              SET status = 'inactive',
                  can_post_job = 0,
                  can_edit_job = 0,
                  can_delete_job = 0,
                  can_approve_job = 0,
                  can_view_applications = 0,
                  can_manage_applications = 0,
                  can_send_email = 0,
                  can_view_salary = 0,
                  can_export_data = 0
            WHERE company_id IN (?)
              AND status <> 'inactive'`
        )
      );
      addCount(
        summary,
        'savedCompanies',
        await runMutationForIds(
          connection,
          ownedCompanyIds,
          'DELETE FROM saved_companies WHERE company_id IN (?)'
        )
      );
      addCount(
        summary,
        'savedCandidates',
        await runMutationForIds(
          connection,
          ownedCompanyIds,
          'DELETE FROM employer_saved_candidates WHERE company_id IN (?)'
        )
      );
      addCount(
        summary,
        'blogs',
        await runMutationForIds(
          connection,
          ownedCompanyIds,
          `UPDATE blog_posts
              SET deleted_at = NOW(),
                  status = 'rejected',
                  updated_at = NOW()
            WHERE company_id IN (?)
              AND deleted_at IS NULL`
        )
      );
      addCount(
        summary,
        'companies',
        await runMutationForIds(
          connection,
          ownedCompanyIds,
          `UPDATE company_profiles
              SET deleted_at = NOW(),
                  updated_at = NOW()
            WHERE id IN (?)
              AND deleted_at IS NULL`
        )
      );
    }

    if (candidateIds.length) {
      addCount(
        summary,
        'interviews',
        await runMutationForIds(
          connection,
          candidateIds,
          `DELETE is2
             FROM interview_schedules is2
             JOIN applications a ON a.id = is2.application_id
            WHERE a.candidate_id IN (?)`
        )
      );
      addCount(
        summary,
        'interviews',
        await runMutationForIds(
          connection,
          candidateIds,
          'DELETE FROM interview_sessions WHERE candidate_id IN (?)'
        )
      );
      addCount(
        summary,
        'offers',
        await runMutationForIds(
          connection,
          candidateIds,
          `DELETE ao
             FROM application_offers ao
             JOIN applications a ON a.id = ao.application_id
            WHERE a.candidate_id IN (?)`
        )
      );
      addCount(
        summary,
        'applications',
        await runMutationForIds(
          connection,
          candidateIds,
          `UPDATE applications
              SET status = 'withdrawn',
                  updated_at = NOW()
            WHERE candidate_id IN (?)
              AND status <> 'withdrawn'`
        )
      );
      addCount(
        summary,
        'savedJobs',
        await runMutationForIds(
          connection,
          candidateIds,
          'DELETE FROM saved_jobs WHERE candidate_id IN (?)'
        )
      );
      addCount(
        summary,
        'savedCompanies',
        await runMutationForIds(
          connection,
          candidateIds,
          'DELETE FROM saved_companies WHERE candidate_id IN (?)'
        )
      );
      addCount(
        summary,
        'aiRecords',
        await runMutation(
          connection,
          'DELETE FROM ai_resume_analysis WHERE user_id = ? OR candidate_id IN (?)',
          [userId, candidateIds]
        )
      );
      addCount(
        summary,
        'candidateSkills',
        await runMutationForIds(
          connection,
          candidateIds,
          'DELETE FROM candidate_skills WHERE candidate_id IN (?)'
        )
      );
      await runMutationForIds(
        connection,
        candidateIds,
        `UPDATE candidate_profiles
            SET profile_visibility = 'private',
                updated_at = NOW()
          WHERE id IN (?)`
      );
    } else {
      addCount(
        summary,
        'aiRecords',
        await runMutation(connection, 'DELETE FROM ai_resume_analysis WHERE user_id = ?', [userId])
      );
    }

    addCount(
      summary,
      'blogs',
      await runMutation(
        connection,
        `UPDATE blog_posts
            SET deleted_at = NOW(),
                status = 'rejected',
                updated_at = NOW()
          WHERE author_id = ?
            AND deleted_at IS NULL`,
        [userId]
      )
    );
    addCount(
      summary,
      'savedCandidates',
      await runMutation(
        connection,
        'DELETE FROM employer_saved_candidates WHERE recruiter_id = ?',
        [userId]
      )
    );
    addCount(
      summary,
      'notifications',
      await runMutation(connection, 'DELETE FROM notifications WHERE user_id = ?', [userId])
    );
    addCount(
      summary,
      'chatbotEvents',
      await runMutation(connection, 'DELETE FROM chatbot_analytics_events WHERE user_id = ?', [
        userId,
      ])
    );

    const conversationIds = await selectIds(
      connection,
      'SELECT id FROM conversations WHERE user_id = ?',
      [userId]
    );
    addCount(
      summary,
      'conversations',
      await runMutationForIds(
        connection,
        conversationIds,
        'DELETE FROM chat_messages WHERE conversation_id IN (?)'
      )
    );
    addCount(
      summary,
      'conversations',
      await runMutationForIds(
        connection,
        conversationIds,
        'DELETE FROM conversations WHERE id IN (?)'
      )
    );

    return summary;
  }

  async deleteUser(adminId, userId, ip, userAgent) {
    const targetId = Number.parseInt(userId, 10);
    if (!Number.isFinite(targetId)) {
      throw new AppError('Invalid user id', 400);
    }
    if (targetId === Number.parseInt(adminId, 10)) {
      throw new AppError('Khong the xoa chinh tai khoan dang dang nhap.', 400);
    }
    await assertAdminActor(adminId);

    const connection = await pool.getConnection();
    let updated = false;
    let summary = {};

    try {
      await connection.beginTransaction();

      const [rows] = await connection.query(
        'SELECT id, email, role, permissions FROM users WHERE id = ? AND deleted_at IS NULL FOR UPDATE',
        [targetId]
      );
      if (!rows.length) {
        await connection.rollback();
        return false;
      }
      summary = await this.cascadeDeleteUserOwnedData(connection, targetId);

      const [result] = await connection.query(
        `UPDATE users
            SET status = ?,
                permissions = NULL,
                deleted_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
            AND deleted_at IS NULL`,
        [USER_STATUS.BANNED, targetId]
      );
      updated = result.affectedRows > 0;

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    if (updated) {
      await ActivityLogRepository.create({
        adminCode: adminId,
        userId: targetId,
        action: 'SOFT_DELETE_USER',
        details: `Soft-deleted user ${targetId} and cleaned up ${formatCascadeSummary(summary)}`,
        ip,
        userAgent,
      });
    }

    return updated;
  }

  async hardDeleteUser(adminId, userId, ip, userAgent) {
    const targetId = Number.parseInt(userId, 10);
    if (!Number.isFinite(targetId)) {
      throw new AppError('Invalid user id', 400);
    }
    if (targetId === Number.parseInt(adminId, 10)) {
      throw new AppError('Khong the xoa chinh tai khoan dang dang nhap.', 400);
    }
    await assertAdminActor(adminId);

    const connection = await pool.getConnection();
    let deleted = false;
    let summary = {};

    try {
      await connection.beginTransaction();

      const [rows] = await connection.query(
        'SELECT id, email, role, permissions FROM users WHERE id = ? FOR UPDATE',
        [targetId]
      );
      if (!rows.length) {
        throw new AppError('Nguoi dung khong ton tai', 404);
      }
      summary = await this.cascadeDeleteUserOwnedData(connection, targetId);

      const [result] = await connection.query('DELETE FROM users WHERE id = ?', [targetId]);
      deleted = result.affectedRows > 0;

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    if (deleted) {
      await ActivityLogRepository.create({
        adminCode: adminId,
        userId: null,
        action: 'HARD_DELETE_USER',
        details: `Permanently deleted user ${targetId} after cleaning up ${formatCascadeSummary(summary)}`,
        ip,
        userAgent,
      });
    }

    return deleted;
  }

  async restoreUser(adminId, userId, ip, userAgent) {
    await assertAdminActor(adminId);

    const updated = await UserRepository.restore(userId);

    if (updated) {
      await ActivityLogRepository.create({
        adminCode: adminId,
        userId: userId,
        action: 'RESTORE_USER',
        details: `Restored user ${userId}`,
        ip,
        userAgent,
      });
    }

    return updated;
  }

  async bulkUpdateUsersStatus(adminId, ids, status, ip, userAgent) {
    if (!Array.isArray(ids) || ids.length === 0) return 0;

    if (
      status !== 'restore' &&
      status !== 'soft-delete' &&
      !status.startsWith('role:') &&
      !USER_STATUS_VALUES.includes(status)
    ) {
      throw new AppError(
        `Invalid user status. Must be one of: ${USER_STATUS_VALUES.join(', ')}`,
        400
      );
    }

    const targetIds = ids.filter((id) => parseInt(id) !== parseInt(adminId) || status === 'active');
    await assertCanManageTargetIds(adminId, targetIds, 'bulk update status');

    if (status === 'restore' || status === 'soft-delete' || status.startsWith('role:')) {
      await assertAdminActor(adminId);
    }

    let count = 0;
    let actionLabel = 'BULK_UPDATE_USER_STATUS';
    let detailsLabel = `Bulk updated ${count} users to status ${status}`;

    if (status === 'restore') {
      count = await UserRepository.bulkRestore(targetIds);
      actionLabel = 'BULK_RESTORE_USERS';
      detailsLabel = `Bulk restored ${count} users`;
    } else if (status === 'soft-delete') {
      for (const targetId of targetIds) {
        if (await this.deleteUser(adminId, targetId, ip, userAgent)) {
          count += 1;
        }
      }
      actionLabel = 'BULK_SOFT_DELETE_USERS';
      detailsLabel = `Bulk soft-deleted ${count} users`;
    } else if (status.startsWith('role:')) {
      const role = status.split(':')[1];
      if (!ROLE_VALUES.includes(role)) {
        throw new AppError(`Invalid role. Must be one of: ${ROLE_VALUES.join(', ')}`, 400);
      }
      count = await UserRepository.bulkUpdateRole(targetIds, role);
      actionLabel = 'BULK_UPDATE_USER_ROLE';
      detailsLabel = `Bulk updated role to ${role} for ${count} users`;
    } else {
      count = await UserRepository.bulkUpdateStatus(targetIds, status);
      detailsLabel = `Bulk updated ${count} users to status ${status}`;
    }

    if (count > 0) {
      await ActivityLogRepository.create({
        adminCode: adminId,
        userId: null,
        action: actionLabel,
        details: detailsLabel,
        ip,
        userAgent,
      });
    }

    return count;
  }

  async lockUser(adminId, userId, ip, userAgent) {
    const user = await UserRepository.findById(userId);
    if (!user) throw new AppError('Người dùng không tồn tại', 404);

    await assertCanManageTargetAdmin(adminId, user, 'lock');

    const updated = await UserRepository.updateStatus(userId, USER_STATUS.SUSPENDED, {
      lockedBy: adminId,
    });

    if (updated) {
      await ActivityLogRepository.create({
        adminCode: adminId,
        userId: userId,
        action: 'LOCK_USER',
        details: `Locked user ${userId}`,
        ip,
        userAgent,
      });
    }

    return updated;
  }

  async unlockUser(adminId, userId, ip, userAgent) {
    const user = await UserRepository.findById(userId);
    if (!user) throw new AppError('Người dùng không tồn tại', 404);

    await assertCanManageTargetAdmin(adminId, user, 'unlock');

    const updated = await UserRepository.updateStatus(userId, USER_STATUS.ACTIVE);

    if (updated) {
      await ActivityLogRepository.create({
        adminCode: adminId,
        userId: userId,
        action: 'UNLOCK_USER',
        details: `Unlocked user ${userId}`,
        ip,
        userAgent,
      });
    }

    return updated;
  }

  async forceLogout(adminId, userId, ip, userAgent) {
    const user = await UserRepository.findById(userId);
    if (!user) throw new AppError('Người dùng không tồn tại', 404);

    await assertCanManageTargetAdmin(adminId, user, 'force logout');

    // Increment updated_at or password_updated_at to signal session invalidation
    const updated = await UserRepository.update(userId, {
      updated_at: new Date(),
      password_updated_at: new Date(),
    });

    if (updated) {
      await ActivityLogRepository.create({
        adminCode: adminId,
        userId: userId,
        action: 'FORCE_LOGOUT_USER',
        details: `Forced logout for user ${userId}`,
        ip,
        userAgent,
      });
    }

    return updated;
  }

  async resetPassword(adminId, userId, newPassword, ip, userAgent) {
    const user = await UserRepository.findById(userId);
    if (!user) throw new AppError('Người dùng không tồn tại', 404);

    await assertCanManageTargetAdmin(adminId, user, 'reset password');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    const updated = await UserRepository.updatePassword(userId, passwordHash);

    if (updated) {
      await ActivityLogRepository.create({
        adminCode: adminId,
        userId: userId,
        action: 'RESET_USER_PASSWORD',
        details: `Reset password for user ${userId}`,
        ip,
        userAgent,
      });
    }

    return updated;
  }

  async resendVerification(adminId, userId, ip, userAgent) {
    const user = await UserRepository.findById(userId);
    if (!user) throw new AppError('Người dùng không tồn tại', 404);

    if (!['pending', USER_STATUS.PENDING_VERIFICATION].includes(user.status)) {
      throw new AppError('Tài khoản đã được xác thực hoặc đang ở trạng thái khác.', 400);
    }

    const EmailService = require('./email');
    await EmailService.sendVerificationEmail(user.email, user.full_name || 'Người dùng');

    await ActivityLogRepository.create({
      adminCode: adminId,
      userId: userId,
      action: 'RESEND_VERIFICATION_EMAIL',
      details: `Resent verification email to user ${userId}`,
      ip,
      userAgent,
    });

    return true;
  }

  async updateUserPermissions(adminId, userId, permissions, ip, userAgent) {
    await assertAdminActor(adminId);

    const user = await UserRepository.findById(userId);
    if (!user) throw new AppError('Người dùng không tồn tại', 404);

    if (normalizeRole(user.role) !== 'admin') {
      throw new AppError('Chỉ có thể cập nhật quyền cho tài khoản Admin', 400);
    }

    const validPermissions = normalizeAdminPermissions(permissions);

    const updated = await UserRepository.updateByAdmin(userId, {
      permissions: JSON.stringify(validPermissions),
    });

    if (updated) {
      await ActivityLogRepository.create({
        adminCode: adminId,
        userId: userId,
        action: 'UPDATE_USER_PERMISSIONS',
        details: `Updated permissions for user ${userId}: ${validPermissions.join(', ')}`,
        ip,
        userAgent,
      });
    }

    return updated;
  }

  async updateJobStatus(adminId, jobId, status, rejectionReason, ip, userAgent) {
    if (!JOB_STATUS_VALUES.includes(status)) {
      throw new AppError(`Invalid status. Allowed: ${JOB_STATUS_VALUES.join(', ')}`, 400);
    }

    const normalizedReason = normalizeOptionalText(rejectionReason);
    if (status === JOB_STATUS.REJECTED && !normalizedReason) {
      throw new AppError('Lý do từ chối tin tuyển dụng là bắt buộc', 400);
    }

    const reasonToPersist = status === JOB_STATUS.REJECTED ? normalizedReason : null;
    const updated = await JobRepository.updateStatus(jobId, status, reasonToPersist);

    if (updated) {
      const action =
        status === JOB_STATUS.REJECTED
          ? 'REJECT_JOB'
          : [JOB_STATUS.PUBLISHED, JOB_STATUS.APPROVED].includes(status)
            ? 'APPROVE_JOB'
            : 'UPDATE_JOB_STATUS';

      await ActivityLogRepository.create({
        adminCode: adminId,
        userId: null,
        action,
        details: `Updated job ${jobId} status to ${status}${normalizedReason ? ` (Reason: ${normalizedReason})` : ''}`,
        ip,
        userAgent,
      });
    }

    return updated;
  }

  async updateJobFlag(adminId, jobId, flagged, note, ip, userAgent) {
    const updated = await JobRepository.flagJob(jobId, flagged, note || null);

    if (updated) {
      await ActivityLogRepository.create({
        adminCode: adminId,
        userId: null,
        action: 'UPDATE_JOB_FLAG',
        details: `Updated job ${jobId} flagged to ${flagged}${note ? ` (${note})` : ''}`,
        ip,
        userAgent,
      });
    }

    return updated;
  }

  async createAdminJob(adminId, jobData, ip, userAgent) {
    const companyId = Number.parseInt(jobData.company_id ?? jobData.employer_id, 10);
    if (!Number.isFinite(companyId)) {
      throw new AppError('Company is required', 400);
    }

    const company = await CompanyRepository.findById(companyId);
    if (!company) {
      throw new AppError('Company not found', 404);
    }

    const result = await JobService.createJob(companyId, adminId, {
      ...jobData,
      company_id: companyId,
    });

    await ActivityLogRepository.create({
      adminCode: adminId,
      userId: null,
      action: 'CREATE_ADMIN_JOB',
      details: `Created job ${result.id} for company ${companyId}`,
      ip,
      userAgent,
    });

    return result;
  }

  async updateAdminJob(adminId, jobId, jobData, ip, userAgent) {
    const companyIdRaw = jobData.company_id ?? jobData.employer_id;
    const companyId = companyIdRaw != null ? Number.parseInt(companyIdRaw, 10) : undefined;

    if (companyIdRaw != null && !Number.isFinite(companyId)) {
      throw new AppError('Company is invalid', 400);
    }

    if (Number.isFinite(companyId)) {
      const company = await CompanyRepository.findById(companyId);
      if (!company) {
        throw new AppError('Company not found', 404);
      }
    }

    const result = await JobService.updateJob(jobId, jobData, {
      companyId: Number.isFinite(companyId) ? companyId : undefined,
      recruiterId: adminId,
    });

    await ActivityLogRepository.create({
      adminCode: adminId,
      userId: null,
      action: 'UPDATE_ADMIN_JOB',
      details: `Updated job ${jobId}${Number.isFinite(companyId) ? ` for company ${companyId}` : ''}`,
      ip,
      userAgent,
    });

    return result;
  }

  async duplicateJob(adminId, jobId, ip, userAgent) {
    const result = await JobRepository.duplicate(jobId);
    if (!result) throw new AppError('Job not found or duplication failed', 404);

    await ActivityLogRepository.create({
      adminCode: adminId,
      userId: null,
      action: 'DUPLICATE_JOB',
      details: `Duplicated job ${jobId} to new job ${result.id}`,
      ip,
      userAgent,
    });

    return result;
  }

  async bulkUpdateJobsStatus(adminId, ids, status, reason, ip, userAgent) {
    if (!Array.isArray(ids) || ids.length === 0) return 0;

    if (!JOB_STATUS_VALUES.includes(status)) {
      throw new AppError(`Invalid status. Allowed: ${JOB_STATUS_VALUES.join(', ')}`, 400);
    }

    const normalizedReason = normalizeOptionalText(reason);
    if (status === JOB_STATUS.REJECTED && !normalizedReason) {
      throw new AppError('Lý do từ chối tin tuyển dụng là bắt buộc khi thao tác hàng loạt', 400);
    }

    const count = await JobRepository.bulkUpdateStatus(
      ids,
      status,
      status === JOB_STATUS.REJECTED ? normalizedReason : null
    );

    if (count > 0) {
      const action =
        status === JOB_STATUS.REJECTED
          ? 'BULK_REJECT_JOBS'
          : [JOB_STATUS.PUBLISHED, JOB_STATUS.APPROVED].includes(status)
            ? 'BULK_APPROVE_JOBS'
            : 'BULK_UPDATE_JOB_STATUS';

      await ActivityLogRepository.create({
        adminCode: adminId,
        userId: null,
        action,
        details: `Bulk updated ${count} jobs to status ${status}${normalizedReason ? ` (Reason: ${normalizedReason})` : ''}`,
        ip,
        userAgent,
      });
    }

    return count;
  }

  async generateBackup() {
    const [users, jobs, applications, companies, settings, categories, skills] = await Promise.all([
      UserRepository.findAllWithFilters({}),
      JobRepository.findWithDetails({}),
      ApplicationRepository.findAll({}),
      CompanyRepository.findAllWithFilters({}),
      require('../models/SystemSettings').findAll(),
      require('../models/Category').findAll(),
      require('../models/Skill').findAll(),
    ]);

    const sanitizedUsers = users.map((u) => {
      const { password: _password, phone: _phone, address: _address, ...safeUser } = u;
      return safeUser;
    });

    return {
      timestamp: new Date().toISOString(),
      version: '1.2',
      data: {
        users: sanitizedUsers,
        jobs,
        applications,
        companies,
        settings,
        categories,
        skills,
      },
    };
  }

  async updateCompanyFlag(adminId, companyId, flagged, note, ip, userAgent) {
    const shouldFlag = parseModerationBoolean(flagged, 'Trạng thái gắn cờ công ty');
    const normalizedNote = normalizeOptionalText(note);
    const updated = await CompanyRepository.flagCompany(companyId, shouldFlag, normalizedNote);

    if (updated) {
      await ActivityLogRepository.create({
        adminCode: adminId,
        userId: null,
        action: 'UPDATE_COMPANY_FLAG',
        details: `Updated company ${companyId} flagged to ${shouldFlag}${normalizedNote ? ` (${normalizedNote})` : ''}`,
        ip,
        userAgent,
      });
    }

    return updated;
  }

  async getUsersStats() {
    const [total, active, pending, newToday] = await Promise.all([
      UserRepository.countWithFilters({}),
      UserRepository.countWithFilters({ status: 'active' }),
      UserRepository.countWithFilters({ status: USER_STATUS.PENDING_VERIFICATION }),
      UserRepository.countWithFilters({
        startDate: new Date().toISOString().split('T')[0] + ' 00:00:00',
      }),
    ]);
    return { total, active, pending, newToday };
  }

  async getEmailLogs(params) {
    const EmailLogRepository = require('../models/EmailLog');
    return await EmailLogRepository.findAll(params);
  }

  async getEmailLogCount(params) {
    const EmailLogRepository = require('../models/EmailLog');
    return await EmailLogRepository.count(params);
  }
  async verifyCompany(adminId, companyId, isVerified, note, ip, userAgent) {
    const shouldVerify = parseModerationBoolean(isVerified, 'Trạng thái duyệt công ty');
    const normalizedNote = normalizeOptionalText(note);
    const company = await CompanyRepository.findById(companyId);

    if (!company) {
      return false;
    }

    if (!shouldVerify && !normalizedNote) {
      throw new AppError('Lý do từ chối công ty là bắt buộc', 400);
    }

    const updated = await CompanyRepository.verifyCompany(companyId, shouldVerify, normalizedNote);

    if (updated) {
      const ownerStatus = String(company.owner_status || '')
        .trim()
        .toLowerCase();
      const ownerLocked = [USER_STATUS.BANNED, USER_STATUS.SUSPENDED, 'locked'].includes(
        ownerStatus
      );

      if (company.user_id && !ownerLocked) {
        await UserRepository.updateStatus(
          company.user_id,
          shouldVerify ? USER_STATUS.ACTIVE : USER_STATUS.PENDING_VERIFICATION,
          { updatedBy: adminId }
        );
      }

      await ActivityLogRepository.create({
        adminCode: adminId,
        userId: company.user_id || null,
        action: shouldVerify ? 'VERIFY_COMPANY' : 'REJECT_COMPANY',
        details: `${shouldVerify ? 'Verified' : 'Rejected verification for'} company ${companyId}${normalizedNote ? ` (${normalizedNote})` : ''}`,
        ip,
        userAgent,
      });
    }

    return updated;
  }

  async deleteCompany(adminId, companyId, ip, userAgent) {
    const CompanyRepository = require('../models/Company');
    const JobRepository = require('../models/Job');
    const BlogRepository = require('../models/Blog');
    const { CompanyMemberRepository } = require('../models/CompanyMember');
    const UserRepository = require('../models/User');
    const InterviewScheduleRepository = require('../models/InterviewSchedule');

    const company = await CompanyRepository.findById(companyId);
    if (!company) return false;

    const updated = await CompanyRepository.softDelete(companyId);

    if (updated) {
      const deletedJobsCount = await JobRepository.bulkDeleteByCompany(companyId);
      const deletedBlogsCount = await BlogRepository.bulkDeleteByCompany(companyId);

      await InterviewScheduleRepository.bulkDeleteByCompany(companyId);
      await InterviewScheduleRepository.bulkDeleteSavedJobsByCompany(companyId);
      await InterviewScheduleRepository.bulkDeleteSavedCompanies(companyId);
      await InterviewScheduleRepository.bulkDeleteEmployerSavedCandidatesByCompany(companyId);

      const deletedMembersCount = await CompanyMemberRepository.bulkDeleteByCompany(companyId);
      const userIds = await CompanyMemberRepository.getUserIdsByCompany(companyId);
      const deletedUsersCount = userIds.length;
      await UserRepository.bulkSoftDelete(userIds);

      await ActivityLogRepository.create({
        adminCode: adminId,
        userId: null,
        action: 'SOFT_DELETE_COMPANY',
        details:
          `Soft-deleted company ${companyId} (${company.company_name}): ` +
          `${deletedJobsCount} jobs, ${deletedBlogsCount} blogs, ` +
          `${deletedMembersCount} company members, ${deletedUsersCount} user accounts`,
        ip,
        userAgent,
      });
    }

    return updated;
  }

  async restoreCompany(adminId, companyId, ip, userAgent) {
    const updated = await CompanyRepository.restore(companyId);

    if (updated) {
      await ActivityLogRepository.create({
        adminCode: adminId,
        userId: null,
        action: 'RESTORE_COMPANY',
        details: `Restored company ${companyId}`,
        ip,
        userAgent,
      });
    }

    return updated;
  }

  async bulkUpdateCompaniesStatus(adminId, ids, status, note, ip, userAgent) {
    if (!Array.isArray(ids) || ids.length === 0) return 0;

    const normalizedNote = normalizeOptionalText(note);
    if (status === 'unverify' && !normalizedNote) {
      throw new AppError('Lý do từ chối công ty là bắt buộc khi thao tác hàng loạt', 400);
    }

    const count = await CompanyRepository.bulkUpdateStatus(ids, status, normalizedNote);

    if (count > 0) {
      if (status === 'verify') {
        await pool.query(
          `UPDATE users u
             JOIN company_profiles cp ON cp.user_id = u.id
              SET u.status = ?, u.updated_at = CURRENT_TIMESTAMP
            WHERE cp.id IN (?)
              AND u.status NOT IN (?, ?, ?)`,
          [USER_STATUS.ACTIVE, ids, USER_STATUS.BANNED, USER_STATUS.SUSPENDED, 'locked']
        );
      } else if (status === 'unverify') {
        await pool.query(
          `UPDATE users u
             JOIN company_profiles cp ON cp.user_id = u.id
              SET u.status = ?, u.updated_at = CURRENT_TIMESTAMP
            WHERE cp.id IN (?)
              AND u.status NOT IN (?, ?, ?)`,
          [
            USER_STATUS.PENDING_VERIFICATION,
            ids,
            USER_STATUS.BANNED,
            USER_STATUS.SUSPENDED,
            'locked',
          ]
        );
      }

      if (status === 'soft-delete') {
        const JobRepository = require('../models/Job');

        for (const companyId of ids) {
          await JobRepository.bulkDeleteByCompany(companyId);
        }
      }

      const actionLabels = {
        verify: 'BULK_VERIFY_COMPANIES',
        unverify: 'BULK_UNVERIFY_COMPANIES',
        flag: 'BULK_FLAG_COMPANIES',
        unflag: 'BULK_UNFLAG_COMPANIES',
        'soft-delete': 'BULK_SOFT_DELETE_COMPANIES',
        restore: 'BULK_RESTORE_COMPANIES',
      };

      await ActivityLogRepository.create({
        adminCode: adminId,
        userId: null,
        action: actionLabels[status] || 'BULK_UPDATE_COMPANIES',
        details: `Bulk updated ${count} companies with status ${status}${normalizedNote ? ` (Reason: ${normalizedNote})` : ''}`,
        ip,
        userAgent,
      });
    }

    return count;
  }

  async banCompany(adminId, companyId, ip, userAgent) {
    const company = await CompanyRepository.findById(companyId);
    if (!company) throw new AppError('Công ty không tồn tại', 404);

    const moderationNote = 'Doanh nghiệp bị khóa bởi quản trị viên';

    // 1. Mark the company as rejected + flagged so it is removed from all public flows.
    await CompanyRepository.banCompany(companyId, moderationNote);

    // 2. Lock the associated recruiter account.
    if (company.user_id) {
      await UserRepository.updateStatus(company.user_id, USER_STATUS.BANNED, {
        lockedBy: adminId,
      });
    }

    // 3. Close all active jobs owned by the company.
    const suspendedCount = await JobRepository.bulkUpdateStatusByCompany(companyId, 'closed');

    await ActivityLogRepository.create({
      adminCode: adminId,
      userId: company.user_id,
      action: 'BAN_COMPANY',
      details: `Banned company ${companyId}, locked recruiter account ${company.user_id}, and closed ${suspendedCount} jobs`,
      ip,
      userAgent,
    });

    return true;
  }

  async updateApplicationStatus(
    adminId,
    applicationId,
    status,
    notes,
    metadata = {},
    ip,
    userAgent
  ) {
    if (!APP_STATUS_VALUES.includes(status)) {
      throw new AppError(
        `Invalid application status. Must be one of: ${APP_STATUS_VALUES.join(', ')}`,
        400
      );
    }
    const application = await ApplicationRepository.findById(applicationId);
    if (!application) throw new AppError('Đơn ứng tuyển không tồn tại', 404);

    const data = normalizeAdminApplicationMetadata(status, metadata);

    const updated = await ApplicationService.updateApplicationStatus(
      applicationId,
      null,
      adminId,
      status,
      notes,
      true,
      data
    );

    if (updated) {
      await ActivityLogRepository.create({
        adminCode: adminId,
        userId: null,
        action: 'UPDATE_APPLICATION_STATUS',
        details: `Updated application ${applicationId} status to ${status}${notes ? ` (Note: ${notes})` : ''}`,
        ip,
        userAgent,
      });
    }

    return updated;
  }

  async updateApplicationInternalNote(adminId, applicationId, note, ip, userAgent) {
    const application = await ApplicationRepository.findById(applicationId);
    if (!application) throw new AppError('Đơn ứng tuyển không tồn tại', 404);

    const updated = await ApplicationRepository.updateInternalNote(applicationId, note);

    if (updated) {
      await ActivityLogRepository.create({
        adminCode: adminId,
        userId: null,
        action: 'UPDATE_APPLICATION_INTERNAL_NOTE',
        details: `Updated internal note for application ${applicationId}`,
        ip,
        userAgent,
      });
    }

    return updated;
  }

  async bulkUpdateApplicationsStatus(adminId, ids, status, notes, ip, userAgent) {
    if (!Array.isArray(ids) || ids.length === 0) return 0;
    if (!APP_STATUS_VALUES.includes(status)) {
      throw new AppError(
        `Invalid application status. Must be one of: ${APP_STATUS_VALUES.join(', ')}`,
        400
      );
    }
    if (
      [APP_STATUS.INTERVIEW_SCHEDULED, APP_STATUS.OFFERED, APP_STATUS.WITHDRAWN].includes(status)
    ) {
      throw new AppError(
        'Không thể cập nhật hàng loạt sang trạng thái này vì cần dữ liệu nghiệp vụ riêng cho từng hồ sơ.',
        400
      );
    }

    const uniqueIds = [
      ...new Set(ids.map((id) => Number.parseInt(id, 10)).filter(Number.isFinite)),
    ];
    if (!uniqueIds.length) return 0;

    const applications = await Promise.all(
      uniqueIds.map(async (id) => {
        const application = await ApplicationRepository.findByIdWithDetails(id);
        if (!application) throw new AppError(`Đơn ứng tuyển #${id} không tồn tại`, 404);
        return application;
      })
    );

    for (const application of applications) {
      if (application.status === status) continue;
      if (!ApplicationService.canTransitionApplicationStatus(application.status, status)) {
        throw new AppError(
          `Không thể chuyển hồ sơ #${application.id} từ "${application.status}" sang "${status}".`,
          400
        );
      }
    }

    let count = 0;
    for (const application of applications) {
      if (application.status === status) continue;
      await ApplicationService.updateApplicationStatus(
        application.id,
        null,
        adminId,
        status,
        notes,
        true,
        {}
      );
      count++;
    }

    if (count > 0) {
      await ActivityLogRepository.create({
        adminCode: adminId,
        userId: null,
        action: 'BULK_UPDATE_APPLICATION_STATUS',
        details: `Bulk updated ${count} applications to status ${status}${notes ? ` (Note: ${notes})` : ''}`,
        ip,
        userAgent,
      });
    }

    return count;
  }
}

module.exports = new AdminService();
