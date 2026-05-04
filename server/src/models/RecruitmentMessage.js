const BaseRepository = require('./Base');
const logger = require('../utils/logger');

const CONVERSATION_TABLE = 'recruitment_conversations';
const MESSAGE_TABLE = 'recruitment_messages';

function clampLimit(value, fallback = 50, max = 100) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

function parsePositiveInt(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function isTruthy(value) {
  return (
    value === true ||
    String(value || '')
      .trim()
      .toLowerCase() === 'true' ||
    value === '1' ||
    value === 1
  );
}

class RecruitmentMessageRepository extends BaseRepository {
  constructor() {
    super(CONVERSATION_TABLE);
    this.schemaPromise = null;
  }

  async ensureSchema() {
    if (!this.schemaPromise) {
      this.schemaPromise = this._ensureSchema().catch((error) => {
        this.schemaPromise = null;
        throw error;
      });
    }
    return this.schemaPromise;
  }

  async _safeQuery(sql, params = []) {
    try {
      await this.pool.query(sql, params);
    } catch (error) {
      if (
        error?.code === 'ER_DUP_FIELDNAME' ||
        error?.code === 'ER_DUP_KEYNAME' ||
        error?.code === 'ER_CANT_DROP_FIELD_OR_KEY' ||
        error?.errno === 1060 ||
        error?.errno === 1061
      ) {
        return;
      }
      logger.warn('Recruitment messaging schema patch skipped', {
        message: error?.message,
        code: error?.code,
      });
    }
  }

  async _ensureColumn(tableName, columnName, definition) {
    const [rows] = await this.pool.query(
      `SELECT COUNT(*) AS total
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = ?
         AND COLUMN_NAME = ?`,
      [tableName, columnName]
    );

    if (Number(rows[0]?.total || 0) > 0) return;
    await this._safeQuery(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }

  async _ensureIndex(tableName, indexName, definition) {
    const [rows] = await this.pool.query(
      `SELECT COUNT(*) AS total
       FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = ?
         AND INDEX_NAME = ?`,
      [tableName, indexName]
    );

    if (Number(rows[0]?.total || 0) > 0) return;
    await this._safeQuery(`CREATE INDEX ${indexName} ON ${tableName} ${definition}`);
  }

  async _ensureSchema() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS ${CONVERSATION_TABLE} (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        application_id INT UNSIGNED NULL,
        job_id INT UNSIGNED NULL,
        candidate_user_id INT UNSIGNED NOT NULL,
        recruiter_user_id INT UNSIGNED NOT NULL,
        company_id INT UNSIGNED NOT NULL,
        conversation_type ENUM('application', 'recruiter_initiated', 'free_chat') NOT NULL DEFAULT 'application',
        initiated_by_user_id INT UNSIGNED NULL,
        status ENUM('active', 'closed', 'blocked') NOT NULL DEFAULT 'active',
        last_message_at DATETIME NULL,
        last_message_preview VARCHAR(500) NULL,
        last_read_candidate_at DATETIME NULL,
        last_read_recruiter_at DATETIME NULL,
        candidate_archived_at DATETIME NULL,
        recruiter_archived_at DATETIME NULL,
        candidate_deleted_at DATETIME NULL,
        recruiter_deleted_at DATETIME NULL,
        candidate_blocked_at DATETIME NULL,
        recruiter_blocked_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_recruitment_conversation_application (application_id),
        INDEX idx_recruitment_conv_candidate (candidate_user_id, updated_at),
        INDEX idx_recruitment_conv_recruiter (recruiter_user_id, updated_at),
        INDEX idx_recruitment_conv_company (company_id, updated_at),
        INDEX idx_recruitment_conv_job (job_id, updated_at),
        INDEX idx_recruitment_conv_last_message (last_message_at),
        CONSTRAINT fk_recruitment_conv_application
          FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
        CONSTRAINT fk_recruitment_conv_job
          FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL,
        CONSTRAINT fk_recruitment_conv_candidate_user
          FOREIGN KEY (candidate_user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_recruitment_conv_recruiter_user
          FOREIGN KEY (recruiter_user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_recruitment_conv_company
          FOREIGN KEY (company_id) REFERENCES company_profiles(id) ON DELETE CASCADE,
        CONSTRAINT fk_recruitment_conv_initiator
          FOREIGN KEY (initiated_by_user_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS ${MESSAGE_TABLE} (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        conversation_id INT UNSIGNED NOT NULL,
        sender_id INT UNSIGNED NULL,
        sender_role ENUM('candidate', 'recruiter', 'admin', 'system') NOT NULL DEFAULT 'system',
        body TEXT NOT NULL,
        message_type ENUM('text', 'file', 'interview_invite', 'job_info', 'system') NOT NULL DEFAULT 'text',
        metadata JSON NULL,
        attachment_url VARCHAR(1000) NULL,
        attachment_name VARCHAR(255) NULL,
        attachment_mime VARCHAR(160) NULL,
        attachment_size INT UNSIGNED NULL,
        status ENUM('sent', 'delivered', 'seen') NOT NULL DEFAULT 'sent',
        delivered_at DATETIME NULL,
        seen_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_recruitment_msg_conversation (conversation_id, created_at),
        INDEX idx_recruitment_msg_sender (sender_id, created_at),
        INDEX idx_recruitment_msg_status (status, created_at),
        CONSTRAINT fk_recruitment_msg_conversation
          FOREIGN KEY (conversation_id) REFERENCES recruitment_conversations(id) ON DELETE CASCADE,
        CONSTRAINT fk_recruitment_msg_sender
          FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await this._ensureColumn(
      CONVERSATION_TABLE,
      'job_id',
      'INT UNSIGNED NULL AFTER application_id'
    );
    await this._ensureColumn(
      CONVERSATION_TABLE,
      'conversation_type',
      "ENUM('application', 'recruiter_initiated', 'free_chat') NOT NULL DEFAULT 'application' AFTER company_id"
    );
    await this._ensureColumn(
      CONVERSATION_TABLE,
      'initiated_by_user_id',
      'INT UNSIGNED NULL AFTER conversation_type'
    );
    await this._ensureColumn(
      CONVERSATION_TABLE,
      'candidate_archived_at',
      'DATETIME NULL AFTER last_read_recruiter_at'
    );
    await this._ensureColumn(
      CONVERSATION_TABLE,
      'recruiter_archived_at',
      'DATETIME NULL AFTER candidate_archived_at'
    );
    await this._ensureColumn(
      CONVERSATION_TABLE,
      'candidate_deleted_at',
      'DATETIME NULL AFTER recruiter_archived_at'
    );
    await this._ensureColumn(
      CONVERSATION_TABLE,
      'recruiter_deleted_at',
      'DATETIME NULL AFTER candidate_deleted_at'
    );
    await this._ensureColumn(
      CONVERSATION_TABLE,
      'candidate_blocked_at',
      'DATETIME NULL AFTER recruiter_deleted_at'
    );
    await this._ensureColumn(
      CONVERSATION_TABLE,
      'recruiter_blocked_at',
      'DATETIME NULL AFTER candidate_blocked_at'
    );

    await this._ensureColumn(MESSAGE_TABLE, 'attachment_url', 'VARCHAR(1000) NULL AFTER metadata');
    await this._ensureColumn(
      MESSAGE_TABLE,
      'attachment_name',
      'VARCHAR(255) NULL AFTER attachment_url'
    );
    await this._ensureColumn(
      MESSAGE_TABLE,
      'attachment_mime',
      'VARCHAR(160) NULL AFTER attachment_name'
    );
    await this._ensureColumn(
      MESSAGE_TABLE,
      'attachment_size',
      'INT UNSIGNED NULL AFTER attachment_mime'
    );
    await this._ensureColumn(
      MESSAGE_TABLE,
      'status',
      "ENUM('sent', 'delivered', 'seen') NOT NULL DEFAULT 'sent' AFTER attachment_size"
    );
    await this._ensureColumn(MESSAGE_TABLE, 'delivered_at', 'DATETIME NULL AFTER status');
    await this._ensureColumn(MESSAGE_TABLE, 'seen_at', 'DATETIME NULL AFTER delivered_at');

    await this._safeQuery(
      `ALTER TABLE ${CONVERSATION_TABLE} MODIFY COLUMN application_id INT UNSIGNED NULL`
    );
    await this._safeQuery(
      `ALTER TABLE ${CONVERSATION_TABLE} MODIFY COLUMN conversation_type ENUM('application', 'recruiter_initiated', 'free_chat') NOT NULL DEFAULT 'application'`
    );
    await this._safeQuery(
      `ALTER TABLE ${CONVERSATION_TABLE} MODIFY COLUMN status ENUM('active', 'closed', 'blocked') NOT NULL DEFAULT 'active'`
    );
    await this._safeQuery(
      `ALTER TABLE ${MESSAGE_TABLE} MODIFY COLUMN message_type ENUM('text', 'file', 'interview_invite', 'job_info', 'system') NOT NULL DEFAULT 'text'`
    );
    await this._safeQuery(
      `ALTER TABLE ${MESSAGE_TABLE} MODIFY COLUMN status ENUM('sent', 'delivered', 'seen') NOT NULL DEFAULT 'sent'`
    );

    await this._ensureIndex(CONVERSATION_TABLE, 'idx_recruitment_conv_job', '(job_id, updated_at)');
    await this._ensureIndex(MESSAGE_TABLE, 'idx_recruitment_msg_status', '(status, created_at)');

    await this._safeQuery(`
      UPDATE ${CONVERSATION_TABLE} c
      JOIN applications a ON a.id = c.application_id
      SET c.job_id = a.job_id,
          c.conversation_type = 'application'
      WHERE c.application_id IS NOT NULL
        AND c.job_id IS NULL
    `);

    await this._ensureNotificationMessageType();
  }

  async _ensureNotificationMessageType() {
    try {
      const [columns] = await this.pool.query("SHOW COLUMNS FROM notifications LIKE 'type'");
      const typeSql = String(columns?.[0]?.Type || '').toLowerCase();
      if (!typeSql || typeSql.includes("'message'")) return;

      await this.pool.query(`
        ALTER TABLE notifications
          MODIFY COLUMN type ENUM(
            'application',
            'job',
            'interview',
            'message',
            'system',
            'moderation',
            'company',
            'report',
            'job_expiring'
          ) NOT NULL DEFAULT 'system'
      `);
    } catch (error) {
      logger.warn('Could not ensure notification message type for recruitment messaging', {
        message: error?.message,
        code: error?.code,
      });
    }
  }

  _conversationSelect({ viewerId = 0, viewerRole = 'candidate' } = {}) {
    const readColumn =
      viewerRole === 'candidate'
        ? 'c.last_read_candidate_at'
        : viewerRole === 'recruiter'
          ? 'c.last_read_recruiter_at'
          : 'NOW()';

    const archivedExpr =
      viewerRole === 'candidate'
        ? 'c.candidate_archived_at IS NOT NULL'
        : viewerRole === 'recruiter'
          ? 'c.recruiter_archived_at IS NOT NULL'
          : '0';

    const blockedByViewerExpr =
      viewerRole === 'candidate'
        ? 'c.candidate_blocked_at IS NOT NULL'
        : viewerRole === 'recruiter'
          ? 'c.recruiter_blocked_at IS NOT NULL'
          : '0';

    const blockedByCounterpartExpr =
      viewerRole === 'candidate'
        ? 'c.recruiter_blocked_at IS NOT NULL'
        : viewerRole === 'recruiter'
          ? 'c.candidate_blocked_at IS NOT NULL'
          : '0';

    return {
      sql: `
        SELECT
          c.*,
          a.status AS application_status,
          a.applied_at,
          COALESCE(c.job_id, a.job_id) AS job_id,
          j.title AS job_title,
          j.job_type,
          j.address AS job_location,
          j.status AS job_status,
          cp.company_name,
          cp.company_logo,
          cp.is_verified AS company_is_verified,
          cp.deleted_at AS company_deleted_at,
          cand.id AS candidate_id,
          cand.current_job_title AS candidate_current_job_title,
          cand.experience_years AS candidate_experience_years,
          cand.location AS candidate_location,
          cand.resume_url AS candidate_resume_url,
          cu.phone AS candidate_phone,
          cand.education_level AS candidate_education_level,
          cand.bio AS candidate_bio,
          TRIM(CONCAT(COALESCE(cu.first_name, ''), ' ', COALESCE(cu.last_name, ''))) AS candidate_name,
          cu.email AS candidate_email,
          cu.avatar_url AS candidate_avatar_url,
          cu.status AS candidate_status,
          cu.deleted_at AS candidate_user_deleted_at,
          TRIM(CONCAT(COALESCE(ru.first_name, ''), ' ', COALESCE(ru.last_name, ''))) AS recruiter_name,
          ru.email AS recruiter_email,
          ru.avatar_url AS recruiter_avatar_url,
          ru.status AS recruiter_status,
          ru.deleted_at AS recruiter_user_deleted_at,
          (${archivedExpr}) AS is_archived,
          (${blockedByViewerExpr}) AS blocked_by_viewer,
          (${blockedByCounterpartExpr}) AS blocked_by_counterpart,
          (
            SELECT COUNT(*)
            FROM ${MESSAGE_TABLE} m_count
            WHERE m_count.conversation_id = c.id
          ) AS message_count,
          (
            SELECT COUNT(*)
            FROM ${MESSAGE_TABLE} m_unread
            WHERE m_unread.conversation_id = c.id
              AND (m_unread.sender_id IS NULL OR m_unread.sender_id <> ?)
              AND m_unread.created_at > COALESCE(${readColumn}, '1970-01-01 00:00:00')
          ) AS unread_count
        FROM ${CONVERSATION_TABLE} c
        LEFT JOIN applications a ON a.id = c.application_id
        LEFT JOIN candidate_profiles cand ON cand.user_id = c.candidate_user_id
        JOIN users cu ON cu.id = c.candidate_user_id
        JOIN users ru ON ru.id = c.recruiter_user_id
        LEFT JOIN jobs j ON j.id = COALESCE(c.job_id, a.job_id)
        JOIN company_profiles cp ON cp.id = c.company_id
      `,
      params: [viewerId],
    };
  }

  async findApplicationContext(applicationId) {
    await this.ensureSchema();
    const [rows] = await this.pool.query(
      `
        SELECT
          a.id AS application_id,
          a.status AS application_status,
          a.applied_at,
          a.candidate_id,
          a.job_id,
          cand.user_id AS candidate_user_id,
          COALESCE(j.recruiter_id, cp.user_id) AS recruiter_user_id,
          j.company_id,
          j.title AS job_title,
          cp.company_name,
          cp.company_logo,
          cp.deleted_at AS company_deleted_at,
          cp.is_verified AS company_is_verified,
          TRIM(CONCAT(COALESCE(cu.first_name, ''), ' ', COALESCE(cu.last_name, ''))) AS candidate_name,
          cu.email AS candidate_email,
          cu.status AS candidate_status,
          cu.deleted_at AS candidate_deleted_at,
          TRIM(CONCAT(COALESCE(ru.first_name, ''), ' ', COALESCE(ru.last_name, ''))) AS recruiter_name,
          ru.email AS recruiter_email,
          ru.status AS recruiter_status,
          ru.deleted_at AS recruiter_deleted_at
        FROM applications a
        JOIN candidate_profiles cand ON cand.id = a.candidate_id
        JOIN users cu ON cu.id = cand.user_id
        JOIN jobs j ON j.id = a.job_id
        JOIN company_profiles cp ON cp.id = j.company_id
        LEFT JOIN users ru ON ru.id = COALESCE(j.recruiter_id, cp.user_id)
        WHERE a.id = ?
        LIMIT 1
      `,
      [applicationId]
    );

    return rows[0] || null;
  }

  async findApplicationContextByCandidateAndJob(candidateUserId, jobId) {
    await this.ensureSchema();
    const [rows] = await this.pool.query(
      `
        SELECT a.id AS application_id
        FROM applications a
        JOIN candidate_profiles cand ON cand.id = a.candidate_id
        WHERE cand.user_id = ?
          AND a.job_id = ?
        ORDER BY a.applied_at DESC, a.id DESC
        LIMIT 1
      `,
      [candidateUserId, jobId]
    );

    return rows[0]?.application_id ? this.findApplicationContext(rows[0].application_id) : null;
  }

  async findCandidateContext({ candidateId, candidateUserId } = {}) {
    await this.ensureSchema();
    const where = [];
    const params = [];

    const parsedCandidateId = parsePositiveInt(candidateId);
    const parsedCandidateUserId = parsePositiveInt(candidateUserId);

    if (parsedCandidateId) {
      where.push('cand.id = ?');
      params.push(parsedCandidateId);
    }

    if (parsedCandidateUserId) {
      where.push('cand.user_id = ?');
      params.push(parsedCandidateUserId);
    }

    if (where.length === 0) return null;

    const [rows] = await this.pool.query(
      `
        SELECT
          cand.id AS candidate_id,
          cand.user_id AS candidate_user_id,
          cand.current_job_title,
          cand.experience_years,
          cand.location,
          cand.resume_url,
          cand.phone,
          TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))) AS candidate_name,
          u.email AS candidate_email,
          u.status AS candidate_status,
          u.deleted_at AS candidate_deleted_at
        FROM candidate_profiles cand
        JOIN users u ON u.id = cand.user_id
        WHERE (${where.join(' OR ')})
          AND u.deleted_at IS NULL
          AND (u.status IS NULL OR u.status = 'active')
        LIMIT 1
      `,
      params
    );

    return rows[0] || null;
  }

  async findCompanyMessagingContext(companyId, jobId = null) {
    await this.ensureSchema();
    const parsedCompanyId = parsePositiveInt(companyId);
    if (!parsedCompanyId) return null;

    const parsedJobId = parsePositiveInt(jobId);
    const [rows] = await this.pool.query(
      `
        SELECT
          cp.id AS company_id,
          cp.user_id AS owner_user_id,
          cp.company_name,
          cp.company_logo,
          cp.deleted_at AS company_deleted_at,
          cp.is_verified AS company_is_verified,
          j.id AS job_id,
          j.title AS job_title,
          COALESCE(j.recruiter_id, cp.user_id) AS recruiter_user_id,
          ru.status AS recruiter_status,
          ru.deleted_at AS recruiter_deleted_at
        FROM company_profiles cp
        LEFT JOIN jobs j ON j.company_id = cp.id AND (? IS NULL OR j.id = ?)
        LEFT JOIN users ru ON ru.id = COALESCE(j.recruiter_id, cp.user_id)
        WHERE cp.id = ?
          AND cp.deleted_at IS NULL
          AND (? IS NULL OR j.id IS NOT NULL)
        ORDER BY j.id DESC
        LIMIT 1
      `,
      [parsedJobId, parsedJobId, parsedCompanyId, parsedJobId]
    );

    return rows[0] || null;
  }

  async upsertConversationForApplication(context, initiatedByUserId = null) {
    await this.ensureSchema();
    const [result] = await this.pool.query(
      `
        INSERT INTO ${CONVERSATION_TABLE}
          (
            application_id,
            job_id,
            candidate_user_id,
            recruiter_user_id,
            company_id,
            conversation_type,
            initiated_by_user_id,
            status,
            last_message_at,
            last_message_preview
          )
        VALUES (?, ?, ?, ?, ?, 'application', ?, 'active', CURRENT_TIMESTAMP, ?)
        ON DUPLICATE KEY UPDATE
          id = LAST_INSERT_ID(id),
          job_id = VALUES(job_id),
          candidate_user_id = VALUES(candidate_user_id),
          recruiter_user_id = VALUES(recruiter_user_id),
          company_id = VALUES(company_id),
          conversation_type = 'application',
          status = CASE WHEN status = 'blocked' THEN status ELSE 'active' END,
          candidate_deleted_at = NULL,
          recruiter_deleted_at = NULL,
          candidate_archived_at = NULL,
          recruiter_archived_at = NULL,
          updated_at = CURRENT_TIMESTAMP
      `,
      [
        context.application_id,
        context.job_id,
        context.candidate_user_id,
        context.recruiter_user_id,
        context.company_id,
        initiatedByUserId,
        `Conversation created for application #${context.application_id}`,
      ]
    );

    return result.insertId;
  }

  async createConversation({
    applicationId = null,
    jobId = null,
    candidateUserId,
    recruiterUserId,
    companyId,
    conversationType = 'recruiter_initiated',
    initiatedByUserId = null,
    preview = 'Conversation created',
  }) {
    await this.ensureSchema();
    const [result] = await this.pool.query(
      `
        INSERT INTO ${CONVERSATION_TABLE}
          (
            application_id,
            job_id,
            candidate_user_id,
            recruiter_user_id,
            company_id,
            conversation_type,
            initiated_by_user_id,
            status,
            last_message_at,
            last_message_preview
          )
        VALUES (?, ?, ?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP, ?)
      `,
      [
        applicationId,
        jobId,
        candidateUserId,
        recruiterUserId,
        companyId,
        conversationType,
        initiatedByUserId,
        preview,
      ]
    );

    return result.insertId;
  }

  async findConversationById(id, viewer = {}) {
    await this.ensureSchema();
    const select = this._conversationSelect(viewer);
    const [rows] = await this.pool.query(
      `${select.sql}
       WHERE c.id = ?
       LIMIT 1`,
      [...select.params, id]
    );
    return rows[0] || null;
  }

  async findConversationByApplicationId(applicationId, viewer = {}) {
    await this.ensureSchema();
    const select = this._conversationSelect(viewer);
    const [rows] = await this.pool.query(
      `${select.sql}
       WHERE c.application_id = ?
       LIMIT 1`,
      [...select.params, applicationId]
    );
    return rows[0] || null;
  }

  async findConversationByParticipants({
    candidateUserId,
    recruiterUserId,
    companyId,
    jobId = null,
    applicationId = null,
    conversationType = null,
    viewer = {},
  } = {}) {
    await this.ensureSchema();
    const select = this._conversationSelect(viewer);
    const where = ['c.candidate_user_id = ?', 'c.recruiter_user_id = ?', 'c.company_id = ?'];
    const params = [...select.params, candidateUserId, recruiterUserId, companyId];

    if (applicationId) {
      where.push('c.application_id = ?');
      params.push(applicationId);
    } else {
      where.push('c.application_id IS NULL');
    }

    if (jobId !== undefined) {
      where.push('(c.job_id <=> ?)');
      params.push(jobId || null);
    }

    if (conversationType) {
      where.push('c.conversation_type = ?');
      params.push(conversationType);
    }

    const [rows] = await this.pool.query(
      `${select.sql}
       WHERE ${where.join(' AND ')}
       ORDER BY c.updated_at DESC, c.id DESC
       LIMIT 1`,
      params
    );

    return rows[0] || null;
  }

  async findConversations({
    viewerId,
    viewerRole,
    companyId,
    limit = 50,
    offset = 0,
    search,
    jobId,
    status,
    includeArchived = false,
    archived = false,
  } = {}) {
    await this.ensureSchema();
    const select = this._conversationSelect({ viewerId, viewerRole });
    const where = [];
    const params = [...select.params];

    if (viewerRole === 'candidate') {
      where.push('c.candidate_user_id = ?');
      where.push('c.candidate_deleted_at IS NULL');
      params.push(viewerId);
      if (isTruthy(archived)) {
        where.push('c.candidate_archived_at IS NOT NULL');
      } else if (!isTruthy(includeArchived)) {
        where.push('c.candidate_archived_at IS NULL');
      }
    } else if (viewerRole === 'recruiter') {
      where.push('c.company_id = ?');
      where.push('c.recruiter_deleted_at IS NULL');
      params.push(companyId);
      if (isTruthy(archived)) {
        where.push('c.recruiter_archived_at IS NOT NULL');
      } else if (!isTruthy(includeArchived)) {
        where.push('c.recruiter_archived_at IS NULL');
      }
    }

    const parsedJobId = parsePositiveInt(jobId);
    if (parsedJobId) {
      where.push('COALESCE(c.job_id, a.job_id) = ?');
      params.push(parsedJobId);
    }

    const normalizedStatus = String(status || '')
      .trim()
      .toLowerCase();
    if (normalizedStatus && normalizedStatus !== 'all') {
      where.push('c.status = ?');
      params.push(normalizedStatus);
    }

    const normalizedSearch = String(search || '').trim();
    if (normalizedSearch) {
      const term = `%${normalizedSearch}%`;
      where.push(`(
        j.title LIKE ?
        OR cp.company_name LIKE ?
        OR cu.first_name LIKE ?
        OR cu.last_name LIKE ?
        OR cu.email LIKE ?
        OR ru.first_name LIKE ?
        OR ru.last_name LIKE ?
        OR ru.email LIKE ?
        OR c.last_message_preview LIKE ?
      )`);
      params.push(term, term, term, term, term, term, term, term, term);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const parsedLimit = clampLimit(limit);
    const parsedOffset = Math.max(Number.parseInt(offset, 10) || 0, 0);

    const [rows] = await this.pool.query(
      `${select.sql}
       ${whereSql}
       ORDER BY COALESCE(c.last_message_at, c.updated_at, c.created_at) DESC, c.id DESC
       LIMIT ? OFFSET ?`,
      [...params, parsedLimit, parsedOffset]
    );

    return rows;
  }

  async findMessages(
    conversationId,
    { limit = 100, offset = 0, latest = false, beforeId = null, before_id = null } = {}
  ) {
    await this.ensureSchema();
    const parsedLimit = clampLimit(limit, 100, 200);
    const parsedOffset = Math.max(Number.parseInt(offset, 10) || 0, 0);
    const parsedBeforeId = parsePositiveInt(beforeId || before_id);
    const shouldLoadLatest = isTruthy(latest) || Boolean(parsedBeforeId);
    const where = ['m.conversation_id = ?'];
    const params = [conversationId];

    if (parsedBeforeId) {
      where.push('m.id < ?');
      params.push(parsedBeforeId);
    }

    const orderSql = shouldLoadLatest
      ? 'ORDER BY m.created_at DESC, m.id DESC'
      : 'ORDER BY m.created_at ASC, m.id ASC';
    const paginationSql = parsedBeforeId ? 'LIMIT ?' : 'LIMIT ? OFFSET ?';
    const paginationParams = parsedBeforeId ? [parsedLimit] : [parsedLimit, parsedOffset];

    const [rows] = await this.pool.query(
      `
        SELECT
          m.*,
          TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))) AS sender_name,
          u.email AS sender_email,
          u.avatar_url AS sender_avatar_url
        FROM ${MESSAGE_TABLE} m
        LEFT JOIN users u ON u.id = m.sender_id
        WHERE ${where.join(' AND ')}
        ${orderSql}
        ${paginationSql}
      `,
      [...params, ...paginationParams]
    );

    return shouldLoadLatest ? rows.reverse() : rows;
  }

  async createMessage({
    conversationId,
    senderId,
    senderRole,
    body,
    messageType = 'text',
    metadata = null,
    attachment = null,
  }) {
    await this.ensureSchema();
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();

      const [insertResult] = await connection.query(
        `
          INSERT INTO ${MESSAGE_TABLE}
            (
              conversation_id,
              sender_id,
              sender_role,
              body,
              message_type,
              metadata,
              attachment_url,
              attachment_name,
              attachment_mime,
              attachment_size,
              status
            )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'sent')
        `,
        [
          conversationId,
          senderId || null,
          senderRole,
          body,
          messageType,
          metadata ? JSON.stringify(metadata) : null,
          attachment?.url || null,
          attachment?.name || null,
          attachment?.mime || null,
          attachment?.size || null,
        ]
      );

      const previewSource = attachment?.name
        ? `📎 ${attachment.name}${body ? ` · ${body}` : ''}`
        : body;
      const preview = String(previewSource || '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 500);
      await connection.query(
        `
          UPDATE ${CONVERSATION_TABLE}
          SET
            last_message_at = CURRENT_TIMESTAMP,
            last_message_preview = ?,
            last_read_candidate_at = CASE
              WHEN ? = 'candidate' THEN CURRENT_TIMESTAMP
              ELSE last_read_candidate_at
            END,
            last_read_recruiter_at = CASE
              WHEN ? = 'recruiter' THEN CURRENT_TIMESTAMP
              ELSE last_read_recruiter_at
            END,
            candidate_archived_at = NULL,
            recruiter_archived_at = NULL,
            candidate_deleted_at = NULL,
            recruiter_deleted_at = NULL,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        [preview, senderRole, senderRole, conversationId]
      );

      await connection.commit();
      return this.findMessageById(insertResult.insertId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async findAttachmentByFilename(
    filename,
    { viewerId = 0, viewerRole = 'candidate', companyId = null } = {}
  ) {
    await this.ensureSchema();
    const where = ['m.attachment_url = ?'];
    const params = [`/api/messages/attachments/${encodeURIComponent(filename)}`];

    if (viewerRole === 'candidate') {
      where.push('c.candidate_user_id = ?');
      where.push('c.candidate_deleted_at IS NULL');
      params.push(viewerId);
    } else if (viewerRole === 'recruiter') {
      where.push('c.company_id = ?');
      where.push('c.recruiter_deleted_at IS NULL');
      params.push(companyId);
    }

    const [rows] = await this.pool.query(
      `
        SELECT m.*, c.candidate_user_id, c.recruiter_user_id, c.company_id
        FROM ${MESSAGE_TABLE} m
        JOIN ${CONVERSATION_TABLE} c ON c.id = m.conversation_id
        WHERE ${where.join(' AND ')}
        LIMIT 1
      `,
      params
    );

    return rows[0] || null;
  }

  async findMessageById(id) {
    await this.ensureSchema();
    const [rows] = await this.pool.query(
      `
        SELECT
          m.*,
          TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))) AS sender_name,
          u.email AS sender_email,
          u.avatar_url AS sender_avatar_url
        FROM ${MESSAGE_TABLE} m
        LEFT JOIN users u ON u.id = m.sender_id
        WHERE m.id = ?
        LIMIT 1
      `,
      [id]
    );
    return rows[0] || null;
  }

  async markMessagesDelivered(conversationId, viewerId) {
    await this.ensureSchema();
    const [result] = await this.pool.query(
      `
        UPDATE ${MESSAGE_TABLE}
        SET status = 'delivered',
            delivered_at = COALESCE(delivered_at, CURRENT_TIMESTAMP)
        WHERE conversation_id = ?
          AND status = 'sent'
          AND (sender_id IS NULL OR sender_id <> ?)
      `,
      [conversationId, viewerId || 0]
    );

    return result.affectedRows;
  }

  async markConversationRead(conversationId, role, viewerId = 0) {
    await this.ensureSchema();
    const column =
      role === 'candidate'
        ? 'last_read_candidate_at'
        : role === 'recruiter'
          ? 'last_read_recruiter_at'
          : null;

    if (!column) return false;

    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const [result] = await connection.query(
        `UPDATE ${CONVERSATION_TABLE} SET ${column} = CURRENT_TIMESTAMP WHERE id = ?`,
        [conversationId]
      );

      await connection.query(
        `
          UPDATE ${MESSAGE_TABLE}
          SET status = 'seen',
              delivered_at = COALESCE(delivered_at, CURRENT_TIMESTAMP),
              seen_at = COALESCE(seen_at, CURRENT_TIMESTAMP)
          WHERE conversation_id = ?
            AND status IN ('sent', 'delivered')
            AND (sender_id IS NULL OR sender_id <> ?)
        `,
        [conversationId, viewerId || 0]
      );

      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async archiveConversation(conversationId, role, archived = true) {
    await this.ensureSchema();
    const column =
      role === 'candidate'
        ? 'candidate_archived_at'
        : role === 'recruiter'
          ? 'recruiter_archived_at'
          : null;
    if (!column) return false;

    const [result] = await this.pool.query(
      `UPDATE ${CONVERSATION_TABLE}
       SET ${column} = ${archived ? 'CURRENT_TIMESTAMP' : 'NULL'},
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [conversationId]
    );

    return result.affectedRows > 0;
  }

  async deleteConversationForRole(conversationId, role) {
    await this.ensureSchema();
    const column =
      role === 'candidate'
        ? 'candidate_deleted_at'
        : role === 'recruiter'
          ? 'recruiter_deleted_at'
          : null;
    if (!column) return false;

    const [result] = await this.pool.query(
      `UPDATE ${CONVERSATION_TABLE}
       SET ${column} = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [conversationId]
    );

    return result.affectedRows > 0;
  }

  async setBlockState(conversationId, role, blocked = true) {
    await this.ensureSchema();
    const column =
      role === 'candidate'
        ? 'candidate_blocked_at'
        : role === 'recruiter'
          ? 'recruiter_blocked_at'
          : null;
    if (!column) return false;

    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const [result] = await connection.query(
        `UPDATE ${CONVERSATION_TABLE}
         SET ${column} = ${blocked ? 'CURRENT_TIMESTAMP' : 'NULL'},
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [conversationId]
      );
      await connection.query(
        `UPDATE ${CONVERSATION_TABLE}
         SET status = CASE
           WHEN candidate_blocked_at IS NOT NULL OR recruiter_blocked_at IS NOT NULL THEN 'blocked'
           ELSE 'active'
         END
         WHERE id = ?`,
        [conversationId]
      );
      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async countRecentMessages({ senderId, conversationId, body }) {
    await this.ensureSchema();
    const [rows] = await this.pool.query(
      `
        SELECT
          SUM(CASE WHEN created_at >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 60 SECOND) THEN 1 ELSE 0 END) AS last_minute_count,
          SUM(CASE WHEN body = ? AND created_at >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 5 MINUTE) THEN 1 ELSE 0 END) AS duplicate_count
        FROM ${MESSAGE_TABLE}
        WHERE sender_id = ?
          AND conversation_id = ?
          AND created_at >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 5 MINUTE)
      `,
      [body || '', senderId, conversationId]
    );

    return {
      last_minute_count: Number(rows[0]?.last_minute_count || 0),
      duplicate_count: Number(rows[0]?.duplicate_count || 0),
    };
  }
}

module.exports = new RecruitmentMessageRepository();
module.exports.RecruitmentMessageRepository = RecruitmentMessageRepository;
