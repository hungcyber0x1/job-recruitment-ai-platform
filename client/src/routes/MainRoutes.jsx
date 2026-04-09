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
  renderEmployerPage,
  renderAdminPage,
} from './route-shells.jsx';

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
      <Route path="/ai-interview" element={renderLazyPage(P.AIInterviewPage)} />
      <Route path="/salary-predictor" element={renderLazyPage(P.SalaryPredictorPage)} />
      <Route path="/categories" element={renderLazyPage(P.CategoriesPage)} />
      <Route path="/career" element={renderLazyPage(P.CareerPage)} />
      <Route path="/blog" element={renderLazyPage(P.BlogPage)} />
      <Route path="/blog/:slug" element={renderLazyPage(P.BlogPostPage)} />

      <Route path="/candidate" element={<Navigate to="/candidate/dashboard" replace />} />
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
      <Route path="/candidate/chat" element={renderCandidatePage(P.CandidateChatCareerPage)} />
      <Route path="/candidate/career-roadmap" element={renderCandidatePage(P.CareerRoadmapPage)} />
      <Route
        path="/candidate/career-suggestions"
        element={renderCandidatePage(P.CareerSuggestionsPage)}
      />
      <Route path="/candidate/settings" element={renderCandidatePage(P.CandidateSettingsPage)} />

      {/* —— Employer —— */}
      <Route path="/employer/dashboard" element={renderEmployerPage(P.EmployerDashboard)} />
      <Route path="/employer/company-profile" element={renderEmployerPage(P.CompanyProfilePage)} />
      <Route
        path="/employer/profile"
        element={<Navigate to="/employer/company-profile" replace />}
      />
      <Route
        path="/employer/company-profile/edit"
        element={renderEmployerPage(P.EditCompanyProfilePage)}
      />
      <Route path="/employer/jobs" element={renderEmployerPage(P.ManageJobsPage)} />
      <Route path="/employer/jobs/post" element={renderEmployerPage(P.PostJobPage)} />
      <Route path="/employer/jobs/:id/edit" element={renderEmployerPage(P.PostJobPage)} />
      <Route path="/employer/applications" element={renderEmployerPage(P.ApplicantsPage)} />
      <Route
        path="/employer/applications/:id"
        element={renderEmployerPage(P.ApplicationDetailPage)}
      />
      <Route
        path="/employer/search-candidates"
        element={renderEmployerPage(P.SearchCandidatesPage)}
      />
      <Route
        path="/employer/saved-candidates"
        element={renderEmployerPage(P.SavedCandidatesPage)}
      />
      <Route path="/employer/messages" element={renderEmployerPage(P.MessagesPage)} />
      <Route
        path="/employer/interview-schedule"
        element={renderEmployerPage(P.InterviewSchedulePage)}
      />
      <Route path="/employer/settings" element={renderEmployerPage(P.EmployerSettingsPage)} />
      <Route path="/employer/blog" element={renderEmployerPage(P.EmployerBlogPage)} />

      {/* —— Admin (path khớp AdminLayout / AdminHeader) —— */}
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/admin/dashboard" element={renderAdminPage(P.AdminDashboardPage)} />
      <Route path="/admin/profile" element={renderAdminPage(P.AdminProfilePage)} />
      <Route path="/admin/users" element={renderAdminPage(P.UsersPage)} />
      <Route path="/admin/users/:id" element={renderAdminPage(P.AdminUserDetailPage)} />
      <Route path="/admin/jobs" element={renderAdminPage(P.AdminJobsPage)} />
      <Route path="/admin/jobs/:id" element={renderAdminPage(P.AdminJobDetailPage)} />
      <Route path="/admin/companies" element={renderAdminPage(P.AdminCompaniesPage)} />
      <Route path="/admin/companies/:id" element={renderAdminPage(P.AdminCompanyDetailPage)} />
      <Route path="/admin/applications" element={renderAdminPage(P.AdminApplicationsPage)} />
      <Route
        path="/admin/applications/:id"
        element={renderAdminPage(P.AdminApplicationDetailPage)}
      />
      <Route path="/admin/categories" element={renderAdminPage(P.AdminCategoriesPage)} />
      <Route path="/admin/analytics" element={renderAdminPage(P.AdminAnalyticsPage)} />
      <Route path="/admin/moderation" element={renderAdminPage(P.AdminModerationPage)} />
      <Route path="/admin/support" element={renderAdminPage(P.AdminSupportPage)} />
      <Route path="/admin/service-health" element={renderAdminPage(P.AdminServiceHealthPage)} />
      <Route path="/admin/feature-flags" element={renderAdminPage(P.AdminFeatureFlagsPage)} />
      <Route path="/admin/settings" element={renderAdminPage(P.AdminSettingsPage)} />
      <Route path="/admin/logs" element={renderAdminPage(P.AdminLogsPage)} />
      <Route path="/admin/chatbot" element={renderAdminPage(P.AdminChatbotPage)} />
      <Route path="/admin/blog" element={renderAdminPage(P.AdminBlogPage)} />

      <Route path="*" element={renderLazyPage(P.NotFoundPage)} />
    </Routes>
  );
}
