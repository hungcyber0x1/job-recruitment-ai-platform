/**
 * Centralized barrel export for all API services
 * @module services
 */

export { default as api } from './api';
export { default as adminService } from './adminService';
export { default as applicationService } from './applicationService';
export {
  default as blogService,
  unwrapBlogListResponse,
  unwrapBlogDetailResponse,
  unwrapBlogTaxonomyResponse,
} from './blogService';
export { default as authService } from './authService';
export { default as candidateService } from './candidateService';
export { default as categoryService } from './categoryService';
export { default as chatbotService } from './chatbotService';
export { default as companyService } from './companyService';
export { default as employerService } from './employerService';
export { default as employerCandidateService } from './employerCandidateService';
export { default as jobService } from './jobService';
export { default as uploadService } from './uploadService';
export { default as userService } from './userService';
export { default as publicToolsService } from './publicToolsService';
export { default as resumeService } from './resumeService';
export { default as aiService } from './aiService';
export { default as featureCatalogService, getFeatureCatalog } from './featureCatalogService';
export { default as privacyService } from './privacyService';
export { default as unifiedProfileService } from './unifiedProfileService';
export { default as notificationService } from './notificationService';
export { default as newsletterService } from './newsletterService';
export { default as messageService } from './messageService';
export { default as auditService } from './auditService';
export { default as employerTeamService } from './employerTeamService';
export { default as employerEmailService } from './employerEmailService';
