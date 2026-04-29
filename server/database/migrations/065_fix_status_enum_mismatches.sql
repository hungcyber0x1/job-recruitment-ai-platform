-- ============================================================
-- Migration 065: Fix Status Enum Mismatches
-- Aligns DB ENUM values with app constants
--
-- Issues fixed:
--   1. jobs.status  DB: (draft/pending/active/paused/closed/rejected)
--                 → CODE: (draft/pending_review/approved/rejected/published/expired/closed/suspended)
--   2. applications.status  DB: (pending/screening/interview/offer/hired/rejected/withdrawn)
--                          → CODE: (submitted/screening/shortlisted/interview_scheduled/interviewed/offered/hired/rejected/withdrawn)
--   3. users.status  DB: (active/pending/inactive/banned/locked)
--                 → CODE: (active/pending_verification/suspended/banned)
--   4. interview_sessions.status  DB: (in_progress/completed)
--                              → CODE needs: (scheduled/completed/cancelled/rescheduled)
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- STEP 1: Migrate existing data to new values
-- ============================================================

-- ── Jobs: map old → new ──────────────────────────────
-- draft → draft         (no change)
-- pending → pending_review
-- active → published
-- paused → suspended
-- closed → closed      (no change)
-- rejected → rejected   (no change)
-- expired does not exist in old schema, will be added via ENUM

UPDATE jobs SET status = 'pending_review' WHERE status = 'pending';
UPDATE jobs SET status = 'published'      WHERE status = 'active';
UPDATE jobs SET status = 'suspended'     WHERE status = 'paused';

-- ── Applications: map old → new ───────────────────────
-- pending → submitted
-- screening → screening         (no change)
-- interview → interviewed
-- offer → offered
-- hired → hired                (no change)
-- rejected → rejected          (no change)
-- withdrawn → withdrawn        (no change)
-- shortlisted does not exist in old, add via ENUM
-- interview_scheduled does not exist in old, add via ENUM

UPDATE applications SET status = 'submitted'   WHERE status = 'pending';
UPDATE applications SET status = 'interviewed' WHERE status = 'interview';
UPDATE applications SET status = 'offered'     WHERE status = 'offer';

-- ── Users: map old → new ──────────────────────────────
-- active → active             (no change)
-- pending → pending_verification
-- inactive → suspended
-- banned → banned             (no change)
-- locked → suspended

UPDATE users SET status = 'pending_verification' WHERE status = 'pending';
UPDATE users SET status = 'suspended'             WHERE status = 'inactive';
UPDATE users SET status = 'suspended'             WHERE status = 'locked';

-- ── Application History: sync old status values ──────────
UPDATE application_history SET new_status = 'submitted'   WHERE new_status = 'pending';
UPDATE application_history SET new_status = 'interviewed' WHERE new_status = 'interview';
UPDATE application_history SET new_status = 'offered'     WHERE new_status = 'offer';

UPDATE application_history SET old_status = 'submitted'   WHERE old_status = 'pending';
UPDATE application_history SET old_status = 'interviewed' WHERE old_status = 'interview';
UPDATE application_history SET old_status = 'offered'     WHERE old_status = 'offer';

-- ============================================================
-- STEP 2: Alter ENUM definitions
-- ============================================================

-- ── Jobs: 8-state job lifecycle ───────────────────────
-- draft → pending_review → approved → published → expired/closed/suspended | rejected
ALTER TABLE jobs
  MODIFY COLUMN status ENUM(
    'draft',
    'pending_review',
    'approved',
    'rejected',
    'published',
    'expired',
    'closed',
    'suspended'
  ) NOT NULL DEFAULT 'draft';

-- ── Applications: 9-state candidate pipeline ───────────
-- submitted → screening → shortlisted → interview_scheduled → interviewed → offered → hired
-- + rejected / withdrawn (side paths)
ALTER TABLE applications
  MODIFY COLUMN status ENUM(
    'submitted',
    'screening',
    'shortlisted',
    'interview_scheduled',
    'interviewed',
    'offered',
    'hired',
    'rejected',
    'withdrawn'
  ) NOT NULL DEFAULT 'submitted';

-- ── Users: 4-state account status ────────────────────
-- active | pending_verification | suspended | banned
ALTER TABLE users
  MODIFY COLUMN status ENUM(
    'active',
    'pending_verification',
    'suspended',
    'banned'
  ) NOT NULL DEFAULT 'active';

-- ── Interview Sessions: add in_progress + rescheduled ───────
-- Old ENUM: (in_progress, completed)  — no data migration needed
-- New ENUM: (scheduled, in_progress, completed, cancelled, rescheduled)

ALTER TABLE interview_sessions
  MODIFY COLUMN status ENUM(
    'scheduled',
    'in_progress',
    'completed',
    'cancelled',
    'rescheduled'
  ) DEFAULT 'scheduled';

-- ============================================================
-- STEP 3: Drop deprecated columns added by migration 041/049
-- ============================================================

-- Column locked_at was added for the old locked status; no longer needed
-- since locked is now mapped to suspended. Safe to drop if no code uses it.
-- Checked: migration 049 creates users with locked_at column.
-- Drop only if the column exists and is not referenced by app code.
-- (Keep locked_at for now to avoid breaking production data — it still stores
-- the lock timestamp; the status column now uses 'suspended' instead.)

-- NOTE: Dropping locked_at would require checking all production code.
-- locked_at column is retained as-is for audit history.

-- ============================================================
-- STEP 4: Verify no stale values remain
-- ============================================================

SELECT 'jobs status stale values:' AS check_name,
       GROUP_CONCAT(DISTINCT status) AS found
FROM jobs
WHERE status NOT IN ('draft','pending_review','approved','rejected','published','expired','closed','suspended')
  AND status IS NOT NULL
UNION ALL
SELECT 'applications status stale values:',
       GROUP_CONCAT(DISTINCT status)
FROM applications
WHERE status NOT IN ('submitted','screening','shortlisted','interview_scheduled','interviewed','offered','hired','rejected','withdrawn')
  AND status IS NOT NULL
UNION ALL
SELECT 'users status stale values:',
       GROUP_CONCAT(DISTINCT status)
FROM users
WHERE status NOT IN ('active','pending_verification','suspended','banned')
  AND status IS NOT NULL
UNION ALL
SELECT 'interview_sessions status stale values:',
       GROUP_CONCAT(DISTINCT status)
FROM interview_sessions
WHERE status NOT IN ('scheduled','in_progress','completed','cancelled','rescheduled')
  AND status IS NOT NULL;

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Migration 065 complete: all status enums aligned with app constants' AS status;
