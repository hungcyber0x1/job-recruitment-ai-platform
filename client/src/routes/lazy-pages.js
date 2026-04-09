/**
 * Code-splitting: mọi trang lazy ở một nơi (dễ audit bundle, thêm route mới).
 * Import từ đây trong MainRoutes — không lazy trùng file khác.
 */
import React from 'react';

// —— Public ——
export const HomePage = React.lazy(() => import('../pages/public/HomePage.jsx'));
export const LoginPage = React.lazy(() => import('../pages/public/LoginPage.jsx'));
export const RegisterPage = React.lazy(() => import('../pages/public/RegisterPage.jsx'));
export const OAuthCallbackPage = React.lazy(() => import('../pages/public/OAuthCallbackPage.jsx'));
export const JobsPage = React.lazy(() => import('../pages/public/JobsPage.jsx'));
export const JobDetailPage = React.lazy(() => import('../pages/public/JobDetailPage.jsx'));
export const CompaniesPage = React.lazy(() => import('../pages/public/CompaniesPage.jsx'));
export const PublicCompanyDetailPage = React.lazy(
  () => import('../pages/public/PublicCompanyDetailPage.jsx')
);
export const AboutPage = React.lazy(() => import('../pages/public/AboutPage.jsx'));
export const ContactPage = React.lazy(() => import('../pages/public/ContactPage.jsx'));
export const ChatPage = React.lazy(() => import('../pages/public/ChatPage.jsx'));
export const AICVScannerPage = React.lazy(() => import('../pages/public/AICVScannerPage.jsx'));
export const AIInterviewPage = React.lazy(() => import('../pages/public/AIInterviewPage.jsx'));
export const SalaryPredictorPage = React.lazy(
  () => import('../pages/public/SalaryPredictorPage.jsx')
);
export const CategoriesPage = React.lazy(() => import('../pages/public/CategoriesPage.jsx'));
export const CareerPage = React.lazy(() => import('../pages/public/CareerPage.jsx'));
export const BlogPage = React.lazy(() => import('../pages/public/BlogPage.jsx'));
export const BlogPostPage = React.lazy(() => import('../pages/public/BlogPostPage.jsx'));
export const NotFoundPage = React.lazy(() => import('../pages/public/NotFoundPage.jsx'));

// —— Candidate ——
export const CandidateDashboard = React.lazy(() => import('../pages/candidate/DashboardPage.jsx'));
export const ProfilePage = React.lazy(() => import('../pages/candidate/ProfilePage.jsx'));
export const ResumePage = React.lazy(() => import('../pages/candidate/ResumePage.jsx'));
export const ApplicationsPage = React.lazy(() => import('../pages/candidate/ApplicationsPage.jsx'));
export const SavedJobsPage = React.lazy(() => import('../pages/candidate/SavedJobsPage.jsx'));
export const CandidateJobsPage = React.lazy(() => import('../pages/candidate/JobsPage.jsx'));
export const CandidateJobDetailPage = React.lazy(
  () => import('../pages/candidate/JobDetailPage.jsx')
);
export const CandidateCompaniesPage = React.lazy(
  () => import('../pages/candidate/CompaniesPage.jsx')
);
export const CandidateCompanyDetailPage = React.lazy(
  () => import('../pages/candidate/CompanyDetailPage.jsx')
);
export const CandidateNotificationsPage = React.lazy(
  () => import('../pages/candidate/NotificationsPage.jsx')
);
export const CandidateChatCareerPage = React.lazy(
  () => import('../pages/candidate/ChatCareerPage.jsx')
);
export const CareerRoadmapPage = React.lazy(
  () => import('../pages/candidate/CareerRoadmapPage.jsx')
);
export const CareerSuggestionsPage = React.lazy(
  () => import('../pages/candidate/CareerSuggestionsPage.jsx')
);
export const CandidateSettingsPage = React.lazy(
  () => import('../pages/candidate/settings/CandidateSettingsPage.jsx')
);
export const EditProfilePage = React.lazy(() => import('../pages/candidate/EditProfilePage.jsx'));
export const AddProjectPage = React.lazy(() => import('../pages/candidate/AddProjectPage.jsx'));

// —— Employer ——
export const EmployerDashboard = React.lazy(() => import('../pages/employer/DashboardPage.jsx'));
export const ManageJobsPage = React.lazy(() => import('../pages/employer/ManageJobsPage.jsx'));
export const PostJobPage = React.lazy(() => import('../pages/employer/PostJobPage.jsx'));
export const ApplicantsPage = React.lazy(() => import('../pages/employer/ApplicantsPage.jsx'));
export const CompanyProfilePage = React.lazy(
  () => import('../pages/employer/CompanyProfilePage.jsx')
);
export const EditCompanyProfilePage = React.lazy(
  () => import('../pages/employer/EditCompanyProfilePage.jsx')
);
export const ApplicationDetailPage = React.lazy(
  () => import('../pages/employer/ApplicationDetailPage.jsx')
);
export const SearchCandidatesPage = React.lazy(
  () => import('../pages/employer/SearchCandidatesPage.jsx')
);
export const SavedCandidatesPage = React.lazy(
  () => import('../pages/employer/SavedCandidatesPage.jsx')
);
export const MessagesPage = React.lazy(() => import('../pages/employer/MessagesPage.jsx'));
export const InterviewSchedulePage = React.lazy(
  () => import('../pages/employer/InterviewSchedulePage.jsx')
);
export const EmployerSettingsPage = React.lazy(
  () => import('../pages/employer/EmployerSettingsPage.jsx')
);
export const EmployerBlogPage = React.lazy(() => import('../pages/employer/EmployerBlogPage.jsx'));

// —— Admin ——
export const AdminDashboardPage = React.lazy(() => import('../pages/admin/DashboardPage.jsx'));
export const UsersPage = React.lazy(() => import('../pages/admin/UsersPage.jsx'));
export const AdminJobsPage = React.lazy(() => import('../pages/admin/AdminJobsPage.jsx'));
export const AdminCompaniesPage = React.lazy(() => import('../pages/admin/CompaniesPage.jsx'));
export const AdminApplicationsPage = React.lazy(
  () => import('../pages/admin/AdminApplicationsPage.jsx')
);
export const AdminApplicationDetailPage = React.lazy(
  () => import('../pages/admin/AdminApplicationDetailPage.jsx')
);
export const AdminJobDetailPage = React.lazy(() => import('../pages/admin/AdminJobDetailPage.jsx'));
export const AdminCompanyDetailPage = React.lazy(
  () => import('../pages/admin/AdminCompanyDetailPage.jsx')
);
export const AdminUserDetailPage = React.lazy(
  () => import('../pages/admin/AdminUserDetailPage.jsx')
);
export const AdminCategoriesPage = React.lazy(
  () => import('../pages/admin/AdminCategoriesPage.jsx')
);
export const AdminSettingsPage = React.lazy(() => import('../pages/admin/AdminSettingsPage.jsx'));
export const AdminLogsPage = React.lazy(() => import('../pages/admin/AdminLogsPage.jsx'));
export const AdminChatbotPage = React.lazy(() => import('../pages/admin/AdminChatbotPage.jsx'));
export const AdminAnalyticsPage = React.lazy(() => import('../pages/admin/AdminAnalyticsPage.jsx'));
export const AdminModerationPage = React.lazy(
  () => import('../pages/admin/AdminModerationPage.jsx')
);
export const AdminSupportPage = React.lazy(() => import('../pages/admin/AdminSupportPage.jsx'));
export const AdminProfilePage = React.lazy(() => import('../pages/admin/AdminProfilePage.jsx'));
export const AdminServiceHealthPage = React.lazy(
  () => import('../pages/admin/AdminServiceHealthPage.jsx')
);
export const AdminFeatureFlagsPage = React.lazy(
  () => import('../pages/admin/AdminFeatureFlagsPage.jsx')
);
export const AdminBlogPage = React.lazy(() => import('../pages/admin/AdminBlogPage.jsx'));
