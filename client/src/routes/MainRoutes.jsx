/**
 * Định nghĩa toàn bộ URL → component (khớp sidebar/link trong từng layout).
 */
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import * as P from './lazy-pages';
import {
  renderLazyPage,
  renderAuthLazyPage,
  renderCandidatePage,
  renderRecruiterPage,
  renderAdminPage,
} from './route-shells.jsx';
import { ADMIN_PERMISSIONS } from '../utils/adminPermissions';

export default function MainRoutes() {
  return (
    <Routes>
      {/* —— Public —— */}
      <Route path="/" element={renderLazyPage(P.HomePage)} />
      <Route path="/login" element={renderLazyPage(P.LoginPage)} />
      <Route path="/register" element={renderLazyPage(P.RegisterPage)} />
      <Route path="/oauth/callback" element={renderLazyPage(P.OAuthCallbackPage)} />
      <Route path="/jobs" element={renderLazyPage(P.JobsPage)} />
      <Route path="/jobs/:id" element={renderLazyPage(P.JobDetailPage)} />
      <Route path="/companies" element={renderLazyPage(P.CompaniesPage)} />
      <Route path="/companies/:id" element={renderLazyPage(P.PublicCompanyDetailPage)} />
      <Route path="/about" element={renderLazyPage(P.AboutPage)} />
      <Route path="/contact" element={renderLazyPage(P.ContactPage)} />
      <Route path="/chat" element={renderAuthLazyPage(P.ChatPage)} />
      <Route path="/ai-cv-scanner" element={renderLazyPage(P.AICVScannerPage)} />
      <Route path="/salary-predictor" element={renderLazyPage(P.SalaryPredictorPage)} />
      <Route path="/categories" element={renderLazyPage(P.CategoriesPage)} />
      <Route path="/career" element={<Navigate to="/chat" replace />} />
      <Route path="/blog" element={renderLazyPage(P.BlogPage)} />
      <Route path="/blog/:slug" element={renderLazyPage(P.BlogPostPage)} />

      <Route path="/candidate" element={<Navigate to="/candidate/dashboard" replace />} />
      {/* /recruiter → redirect sang /employer để khớp route thực */}
      <Route path="/recruiter/dashboard" element={<Navigate to="/employer/dashboard" replace />} />
      <Route path="/recruiter" element={<Navigate to="/employer/dashboard" replace />} />
      <Route path="/employer" element={<Navigate to="/employer/dashboard" replace />} />

      {/* —— Candidate —— */}
      <Route path="/candidate/dashboard" element={renderCandidatePage(P.CandidateDashboard)} />
      <Route path="/candidate/applications" element={renderCandidatePage(P.ApplicationsPage)} />
      <Route path="/candidate/resume" element={renderCandidatePage(P.ResumePage)} />
      <Route path="/candidate/profile" element={renderCandidatePage(P.ProfilePage)} />
      <Route path="/candidate/profile/edit" element={renderCandidatePage(P.EditProfilePage)} />
      <Route
        path="/candidate/profile/projects/new"
        element={renderCandidatePage(P.AddProjectPage)}
      />
      <Route path="/candidate/saved-jobs" element={renderCandidatePage(P.SavedJobsPage)} />
      <Route
        path="/candidate/saved-companies"
        element={renderCandidatePage(P.CandidateSavedCompaniesPage)}
      />
      <Route path="/candidate/jobs" element={renderCandidatePage(P.CandidateJobsPage)} />
      <Route path="/candidate/jobs/:id" element={renderCandidatePage(P.CandidateJobDetailPage)} />
      <Route path="/candidate/companies" element={renderCandidatePage(P.CandidateCompaniesPage)} />
      <Route
        path="/candidate/companies/:id"
        element={renderCandidatePage(P.CandidateCompanyDetailPage)}
      />
      <Route
        path="/candidate/notifications"
        element={renderCandidatePage(P.CandidateNotificationsPage)}
      />
      <Route path="/candidate/messages" element={renderCandidatePage(P.CandidateMessagesPage)} />
      <Route
        path="/candidate/interviews"
        element={renderCandidatePage(P.CandidateInterviewSchedulePage)}
      />
      <Route path="/candidate/interview-prep" element={renderCandidatePage(P.InterviewPrepPage)} />
      <Route
        path="/candidate/profile-analytics"
        element={<Navigate to="/candidate/profile" replace />}
      />
      <Route path="/candidate/chat" element={renderCandidatePage(P.CandidateChatCareerPage)} />
      <Route path="/candidate/settings" element={renderCandidatePage(P.CandidateSettingsPage)} />

      {/* —— Employer —— */}
      <Route path="/employer/dashboard" element={renderRecruiterPage(P.EmployerDashboard)} />
      <Route path="/employer/company-profile" element={renderRecruiterPage(P.CompanyProfilePage)} />
      <Route
        path="/employer/profile"
        element={<Navigate to="/employer/company-profile" replace />}
      />
      <Route
        path="/employer/company-profile/edit"
        element={renderRecruiterPage(P.EditCompanyProfilePage)}
      />
      <Route path="/employer/jobs" element={renderRecruiterPage(P.ManageJobsPage)} />
      <Route path="/employer/jobs/post" element={renderRecruiterPage(P.PostJobPage)} />
      <Route path="/employer/jobs/new" element={<Navigate to="/employer/jobs/post" replace />} />
      <Route path="/employer/jobs/:id/edit" element={renderRecruiterPage(P.PostJobPage)} />
      <Route path="/employer/applications" element={renderRecruiterPage(P.ApplicantsPage)} />
      <Route
        path="/employer/applications/:id"
        element={renderRecruiterPage(P.ApplicationDetailPage)}
      />
      <Route
        path="/employer/search-candidates"
        element={renderRecruiterPage(P.SearchCandidatesPage)}
      />
      {/* Talent Pool - Professional Candidate Management */}
      <Route path="/employer/talent-pool" element={renderRecruiterPage(P.TalentPoolPreviewPage)} />
      <Route
        path="/employer/saved-candidates"
        element={renderRecruiterPage(P.SavedCandidatesPage)}
      />
      <Route path="/employer/messages" element={renderRecruiterPage(P.MessagesPage)} />
      <Route
        path="/employer/interview-schedule"
        element={renderRecruiterPage(P.EmployerInterviewSchedulePage)}
      />
      <Route path="/employer/settings" element={renderRecruiterPage(P.EmployerSettingsPage)} />
      <Route path="/employer/reports" element={renderRecruiterPage(P.RecruitmentReportPage)} />
      <Route path="/employer/blog" element={renderRecruiterPage(P.EmployerBlogPage)} />
      <Route
        path="/employer/notifications"
        element={renderRecruiterPage(P.RecruiterNotificationsPage)}
      />

      {/* —— Admin: quản lý đúng các dữ liệu/nội dung người dùng nhìn thấy hoặc tương tác —— */}
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/admin/dashboard" element={renderAdminPage(P.AdminDashboardPage)} />
      <Route path="/admin/users" element={renderAdminPage(P.UsersPage)} />
      <Route path="/admin/users/:id" element={renderAdminPage(P.AdminUserDetailPage)} />
      <Route path="/admin/jobs" element={renderAdminPage(P.AdminJobsPage)} />
      <Route path="/admin/jobs/new" element={<Navigate to="/admin/jobs" replace />} />
      <Route path="/admin/jobs/:id" element={renderAdminPage(P.AdminJobDetailPage)} />
      <Route path="/admin/jobs/:id/edit" element={renderAdminPage(P.AdminJobEditorPage)} />
      <Route path="/admin/companies" element={renderAdminPage(P.AdminCompaniesPage)} />
      <Route path="/admin/companies/:id" element={renderAdminPage(P.AdminCompanyDetailPage)} />
      <Route path="/admin/applications" element={renderAdminPage(P.AdminApplicationsPage)} />
      <Route
        path="/admin/applications/:id"
        element={renderAdminPage(P.AdminApplicationDetailPage)}
      />
      <Route path="/admin/homepage" element={<Navigate to="/admin/blog" replace />} />
      <Route path="/admin/blog" element={renderAdminPage(P.AdminBlogPage)} />
      <Route
        path="/admin/categories"
        element={renderAdminPage(P.AdminCategoriesPage, {
          adminPermission: ADMIN_PERMISSIONS.TAXONOMY_MANAGE,
        })}
      />
      <Route
        path="/admin/skills"
        element={renderAdminPage(P.SkillManagementPage, {
          adminPermission: ADMIN_PERMISSIONS.TAXONOMY_MANAGE,
        })}
      />
      <Route path="/admin/analytics" element={renderAdminPage(P.AdminAnalyticsPage)} />
      <Route path="/admin/settings" element={renderAdminPage(P.AdminSettingsPage)} />
      <Route path="/admin/profile" element={renderAdminPage(P.AdminProfilePage)} />

      {/* Legacy admin modules are detached from the visible Admin UI and redirected to active modules. */}
      <Route path="/admin/interviews" element={<Navigate to="/admin/applications" replace />} />
      <Route path="/admin/chatbot" element={<Navigate to="/admin/settings" replace />} />
      <Route path="/admin/moderation" element={<Navigate to="/admin/jobs" replace />} />
      <Route path="/admin/support" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/admin/service-health" element={<Navigate to="/admin/settings" replace />} />
      <Route path="/admin/feature-flags" element={<Navigate to="/admin/settings" replace />} />
      <Route path="/admin/permissions" element={<Navigate to="/admin/users" replace />} />
      <Route path="/admin/ai-tools" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/admin/email-logs" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/admin/notifications" element={<Navigate to="/admin/dashboard" replace />} />

      <Route path="*" element={renderLazyPage(P.NotFoundPage)} />
    </Routes>
  );
}
