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
const AppError = require('../utils/errorHandler');
const bcrypt = require('bcryptjs');
const {
  APP_STATUS_VALUES,
  ROLE_VALUES,
  USER_STATUS,
  USER_STATUS_VALUES,
} = require('../utils/constants');
const {
  ADMIN_PERMISSIONS,
  hasAdminPermission,
  isSuperAdminIdentity,
  normalizeAdminPermissions,
} = require('../utils/admin-permissions');

function normalizeRole(role) {
  const normalizedRole = String(role ?? '').trim().toLowerCase();
  return normalizedRole === 'employer' ? 'recruiter' : normalizedRole;
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
      rows
        .map((row) => Number.parseInt(row?.[key], 10))
        .filter((id) => Number.isFinite(id))
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

async function assertSuperAdmin(adminId, message = 'Only Super Admin can perform this action') {
  const actor = await getActorAdmin(adminId);
  if (!hasAdminPermission(actor, ADMIN_PERMISSIONS.ALL)) {
    throw new AppError(message, 403);
  }
  return actor;
}

async function assertCanManageTargetAdmin(adminId, targetUser, actionLabel = 'manage this account') {
  if (!targetUser || normalizeRole(targetUser.role) !== 'admin') return;

  const actor = await getActorAdmin(adminId);
  if (!hasAdminPermission(actor, ADMIN_PERMISSIONS.ALL)) {
    throw new AppError(`Only Super Admin can ${actionLabel} for admin accounts`, 403);
  }
}

async function assertCanManageTargetIds(adminId, targetIds, actionLabel = 'manage these accounts') {
  const ids = targetIds
    .map((id) => Number.parseInt(id, 10))
    .filter((id) => Number.isFinite(id));
  if (!ids.length) return;

  const [rows] = await pool.query(
    'SELECT id, email, role, permissions FROM users WHERE id IN (?)',
    [ids]
  );
  if (!rows.some((row) => normalizeRole(row.role) === 'admin')) return;

  await assertSuperAdmin(adminId, `Only Super Admin can ${actionLabel} for admin accounts`);
}

class AdminService {
  async getDashboardStats() {
    const [
      usersCount,
      jobsCount,
      applicationsCount,
      openTickets,
      pendingJobs,
      flaggedJobs,
      unverifiedCompanies,
      verifiedCount,
      flaggedCompanies,
      applicationsByStatus,
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
      CompanyRepository.countByVerification(false),
      CompanyRepository.countByVerification(true),
      CompanyRepository.countFlagged(),
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
      pool.query(
        `SELECT status, COUNT(*) as count FROM jobs GROUP BY status`
      ),
      // D: Skill count
      SkillRepository?.countAll ? SkillRepository.countAll() : Promise.resolve(0),
      // D: Industry count
      pool.query(
        `SELECT COUNT(DISTINCT industry) as total FROM company_profiles WHERE industry IS NOT NULL AND industry != ''`
      ),
      // D: Location count (from jobs)
      pool.query(
        `SELECT COUNT(DISTINCT location_id) as total FROM jobs WHERE location_id IS NOT NULL`
      ),
    ]);

    // Parse user by role array
    const roleRows = userByRole[0] || [];
    const byRole = {};
    let candidateCount = 0, recruiterCount = 0, adminCount = 0;
    for (const row of roleRows) {
      byRole[row.role] = Number(row.count);
      if (row.role === 'candidate') candidateCount = Number(row.count);
      else if (row.role === 'recruiter' || row.role === 'employer') recruiterCount = Number(row.count);
      else if (row.role === 'admin') adminCount = Number(row.count);
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

    // Top skills query (Block D)
    let topSkills = [];
    try {
      const [skillRows] = await pool.query(`
        SELECT s.name, COUNT(sa.id) as count
        FROM skills s
        LEFT JOIN skill_assessments sa ON sa.skill_id = s.id
        GROUP BY s.id, s.name
        ORDER BY count DESC
        LIMIT 8
      `);
      topSkills = skillRows.map(r => ({ name: r.name, count: Number(r.count) }));
    } catch { /* graceful fallback */ }

    // Top industries query
    let topIndustries = [];
    try {
      const [indRows] = await pool.query(`
        SELECT industry as name, COUNT(*) as count
        FROM company_profiles
        WHERE industry IS NOT NULL AND industry != ''
        GROUP BY industry
        ORDER BY count DESC
        LIMIT 6
      `);
      topIndustries = indRows.map(r => ({ name: r.name, count: Number(r.count) }));
    } catch { /* graceful fallback */ }

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
      topLocations = locRows.map(r => ({ name: r.name, count: Number(r.count) }));
    } catch { /* graceful fallback */ }

    // Pipeline: map application statuses
    const apps = applicationsByStatus || {};
    const totalApps = applicationsCount || 1;
    const submittedCount = Number(apps.submitted || 0);
    const shortlistingCount = Number(apps.shortlisted || 0);
    const interviewCount =
      Number(apps.interview_scheduled || 0) +
      Number(apps.interviewed || 0) +
      Number(apps.offered || 0);
    const hiredCount = Number(apps.hired || 0);
    const rejectedCount = Number(apps.rejected || 0);

    return {
      // A. Người dùng & Phân quyền
      users: usersCount,
      userDistribution: roleRows.map(r => ({ role: r.role, count: Number(r.count) })),
      candidateAccounts: candidateCount,
      recruiterAccounts: recruiterCount,
      adminAccounts: adminCount,
      lockedAccounts: Number(lockedAccounts[0]?.[0]?.total || 0),

      // B. Doanh nghiệp & Tuyển dụng
      companies: verifiedCount + unverifiedCompanies,
      verifiedCompanies: verifiedCount,
      unverifiedCompanies,
      jobs: jobsCount,
      publishedJobs,
      pendingJobApprovals: pendingJobs,
      rejectedJobs: jobStatusCounts.rejected || 0,
      closedJobs: jobStatusCounts.closed || 0,
      applications: applicationsCount,
      // Pipeline counts
      pipeline: {
        submitted: submittedCount,
        shortlisted: shortlistingCount,
        interview_scheduled: Number(apps.interview_scheduled || 0),
        interviewed: Number(apps.interviewed || 0),
        offered: Number(apps.offered || 0),
        hired: hiredCount,
        rejected: rejectedCount,
      },
      // Pipeline conversion rates
      conversion: {
        submittedToShortlisted: totalApps > 0 ? Math.round((shortlistingCount / totalApps) * 100) : 0,
        shortlistedToInterview: shortlistingCount > 0 ? Math.round((interviewCount / shortlistingCount) * 100) : 0,
        interviewToHired: interviewCount > 0 ? Math.round((hiredCount / interviewCount) * 100) : 0,
        submittedToHired: totalApps > 0 ? Math.round((hiredCount / totalApps) * 100) : 0,
      },
      // Moderation (within B)
      moderation: {
        pendingJobs,
        flaggedJobs,
        unverifiedCompanies,
        flaggedCompanies,
        pendingBlogs,
        flaggedBlogs,
      },

      // C. Nội dung Public
      blogPosts: pendingBlogs,
      homepageBanners: 0,

      // D. Taxonomy dữ liệu
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
        spamDetected: flaggedJobs + flaggedCompanies + flaggedBlogs,
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
      throw new AppError(`Invalid user status. Must be one of: ${USER_STATUS_VALUES.join(', ')}`, 400);
    }

    const user = await UserRepository.findById(userId);
    if (!user) throw new AppError('Người dùng không tồn tại', 404);

    await assertCanManageTargetAdmin(adminId, user, 'update status');

    const updated = await UserRepository.updateStatus(userId, status);

    if (updated) {
      if (normalizeRole(user.role) === 'recruiter' && user.status === USER_STATUS.PENDING_VERIFICATION && status === USER_STATUS.ACTIVE) {
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

    if (updateData.role !== undefined || updateData.permissions !== undefined) {
      await assertSuperAdmin(adminId, 'Only Super Admin can change admin role or permissions');
    }

    if (updateData.permissions !== undefined && normalizeRole(user.role) !== 'admin') {
      throw new AppError('Permissions can only be assigned to admin accounts', 400);
    }

    if (updateData.role && !ROLE_VALUES.includes(updateData.role)) {
      throw new AppError(`Invalid role. Must be one of: ${ROLE_VALUES.join(', ')}`, 400);
    }

    if (updateData.status) {
      if (!USER_STATUS_VALUES.includes(updateData.status)) {
        throw new AppError(`Invalid user status. Must be one of: ${USER_STATUS_VALUES.join(', ')}`, 400);
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
      if (normalizeRole(user.role) === 'recruiter' && user.status === USER_STATUS.PENDING_VERIFICATION && updateData.status === USER_STATUS.ACTIVE) {
        try {
          const EmailService = require('./email');
          EmailService.sendAccountApprovalEmail(
            user.email,
            `${updateData.first_name || user.first_name || ''} ${updateData.last_name || user.last_name || ''}`.trim() || 'Nhà tuyển dụng'
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
        'interviews',
        await runMutationForIds(
          connection,
          jobIds,
          `DELETE isess
             FROM interview_sessions isess
             JOIN applications a ON a.id = isess.application_id
            WHERE a.job_id IN (?)`
        )
      );
      addCount(
        summary,
        'interviews',
        await runMutationForIds(
          connection,
          jobIds,
          'DELETE FROM interview_questions WHERE job_id IN (?)'
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
        await runMutationForIds(connection, candidateIds, 'DELETE FROM saved_jobs WHERE candidate_id IN (?)')
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
      'notifications',
      await runMutation(connection, 'DELETE FROM chatbot_analytics WHERE user_id = ?', [userId])
    );

    const oldConversationIds = await selectIds(
      connection,
      'SELECT id FROM conversations WHERE user_id = ?',
      [userId]
    );
    addCount(
      summary,
      'conversations',
      await runMutationForIds(
        connection,
        oldConversationIds,
        'DELETE FROM chat_messages WHERE conversation_id IN (?)'
      )
    );
    addCount(
      summary,
      'conversations',
      await runMutationForIds(connection, oldConversationIds, 'DELETE FROM conversations WHERE id IN (?)')
    );

    const chatbotConversationIds = await selectIds(
      connection,
      'SELECT id FROM chatbot_conversations WHERE candidate_id = ? OR recruiter_id = ?',
      [userId, userId]
    );
    addCount(
      summary,
      'conversations',
      await runMutationForIds(
        connection,
        chatbotConversationIds,
        'DELETE FROM chatbot_messages WHERE conversation_id IN (?)'
      )
    );
    addCount(
      summary,
      'conversations',
      await runMutationForIds(
        connection,
        chatbotConversationIds,
        'DELETE FROM chatbot_conversations WHERE id IN (?)'
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
    await assertSuperAdmin(adminId, 'Only Super Admin can delete user accounts');

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
      if (isSuperAdminIdentity(rows[0])) {
        throw new AppError('Super Admin accounts cannot be deleted', 403);
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
    await assertSuperAdmin(adminId, 'Only Super Admin can permanently delete user accounts');

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
      if (isSuperAdminIdentity(rows[0])) {
        throw new AppError('Super Admin accounts cannot be permanently deleted', 403);
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
    await assertSuperAdmin(adminId, 'Only Super Admin can restore deleted user accounts');

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

    if (status !== 'restore' && status !== 'soft-delete' && !status.startsWith('role:') && !USER_STATUS_VALUES.includes(status)) {
      throw new AppError(`Invalid user status. Must be one of: ${USER_STATUS_VALUES.join(', ')}`, 400);
    }

    const targetIds = ids.filter(id => parseInt(id) !== parseInt(adminId) || status === 'active');
    await assertCanManageTargetIds(adminId, targetIds, 'bulk update status');

    if (status === 'restore' || status === 'soft-delete' || status.startsWith('role:')) {
      await assertSuperAdmin(adminId, 'Only Super Admin can bulk restore, delete, or change roles');
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
    await assertSuperAdmin(adminId, 'Only Super Admin can update admin permissions');

    const user = await UserRepository.findById(userId);
    if (!user) throw new AppError('Người dùng không tồn tại', 404);

    if (normalizeRole(user.role) !== 'admin') {
      throw new AppError('Chỉ có thể cập nhật quyền cho tài khoản Admin', 400);
    }

    const validPermissions = normalizeAdminPermissions(permissions);

    const updated = await UserRepository.updateByAdmin(userId, {
      permissions: JSON.stringify(validPermissions)
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
    const { JOB_STATUS_VALUES } = require('../utils/constants');
    if (!JOB_STATUS_VALUES.includes(status)) {
      throw new AppError(`Invalid status. Allowed: ${JOB_STATUS_VALUES.join(', ')}`, 400);
    }

    const updated = await JobRepository.updateStatus(jobId, status, rejectionReason);

    if (updated) {
      await ActivityLogRepository.create({
        adminCode: adminId,
        userId: null,
        action: 'UPDATE_JOB_STATUS',
        details: `Updated job ${jobId} status to ${status}`,
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
    const companyId =
      companyIdRaw != null ? Number.parseInt(companyIdRaw, 10) : undefined;

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

    const count = await JobRepository.bulkUpdateStatus(ids, status, reason);

    if (count > 0) {
      await ActivityLogRepository.create({
        adminCode: adminId,
        userId: null,
        action: 'BULK_UPDATE_JOB_STATUS',
        details: `Bulk updated ${count} jobs to status ${status}${reason ? ` (Reason: ${reason})` : ''}`,
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
      require('../models/Skill').findAll()
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
        skills
      },
    };
  }

  async updateCompanyFlag(adminId, companyId, flagged, note, ip, userAgent) {
    const updated = await CompanyRepository.flagCompany(companyId, flagged, note);

    if (updated) {
      await ActivityLogRepository.create({
        adminCode: adminId,
        userId: null,
        action: 'UPDATE_COMPANY_FLAG',
        details: `Updated company ${companyId} flagged to ${flagged}${note ? ` (${note})` : ''}`,
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
    const updated = await CompanyRepository.verifyCompany(companyId, isVerified, note);

    if (updated) {
      await ActivityLogRepository.create({
        adminCode: adminId,
        userId: null,
        action: isVerified ? 'VERIFY_COMPANY' : 'REJECT_COMPANY',
        details: `${isVerified ? 'Verified' : 'Rejected verification for'} company ${companyId}${note ? ` (${note})` : ''}`,
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
        details: `Soft-deleted company ${companyId} (${company.company_name}): ` +
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

  async bulkUpdateCompaniesStatus(adminId, ids, status, ip, userAgent) {
    if (!Array.isArray(ids) || ids.length === 0) return 0;

    const count = await CompanyRepository.bulkUpdateStatus(ids, status);

    if (count > 0) {
      if (status === 'soft-delete') {
        const JobRepository = require('../models/Job');

        for (const companyId of ids) {
          await JobRepository.bulkDeleteByCompany(companyId);
        }
      }

      const actionLabels = {
        'verify': 'BULK_VERIFY_COMPANIES',
        'unverify': 'BULK_UNVERIFY_COMPANIES',
        'flag': 'BULK_FLAG_COMPANIES',
        'unflag': 'BULK_UNFLAG_COMPANIES',
        'soft-delete': 'BULK_SOFT_DELETE_COMPANIES',
        'restore': 'BULK_RESTORE_COMPANIES'
      };

      await ActivityLogRepository.create({
        adminCode: adminId,
        userId: null,
        action: actionLabels[status] || 'BULK_UPDATE_COMPANIES',
        details: `Bulk updated ${count} companies with status ${status}`,
        ip,
        userAgent,
      });
    }

    return count;
  }

  async banCompany(adminId, companyId, ip, userAgent) {
    const company = await CompanyRepository.findById(companyId);
    if (!company) throw new AppError('Công ty không tồn tại', 404);

    // 1. Flag the company
    await CompanyRepository.flagCompany(companyId, true, 'Banned by Admin');

    // 2. Lock the associated user
    if (company.user_id) {
      await UserRepository.updateStatus(company.user_id, USER_STATUS.BANNED, {
        lockedBy: adminId,
      });
    }

    // 3. Suspend all jobs
    const suspendedCount = await JobRepository.bulkUpdateStatusByCompany(companyId, 'closed');

    await ActivityLogRepository.create({
      adminCode: adminId,
      userId: company.user_id,
      action: 'BAN_COMPANY',
      details: `Banned company ${companyId}, locked employer account ${company.user_id}, and closed ${suspendedCount} jobs`,
      ip,
      userAgent,
    });

    return true;
  }

  async updateApplicationStatus(adminId, applicationId, status, notes, offerDetails, ip, userAgent) {
    if (!APP_STATUS_VALUES.includes(status)) {
      throw new AppError(`Invalid application status. Must be one of: ${APP_STATUS_VALUES.join(', ')}`, 400);
    }
    const application = await ApplicationRepository.findById(applicationId);
    if (!application) throw new AppError('Đơn ứng tuyển không tồn tại', 404);

    const data = {};
    if (offerDetails) {
      data.offer_details = offerDetails;
    }

    const updated = await ApplicationRepository.updateStatus(applicationId, status, adminId, notes, data);

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
      throw new AppError(`Invalid application status. Must be one of: ${APP_STATUS_VALUES.join(', ')}`, 400);
    }
    const count = await ApplicationRepository.bulkUpdateStatus(ids, status, adminId, notes);

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
