/**
 * Centralized barrel export for all API services
 * @module services
 */

export { default as api } from './api';
export { default as adminService } from './adminService';
export { default as adminChatbotService } from './adminChatbotService';
export { default as applicationService } from './applicationService';
export {
  default as blogService,
  unwrapBlogListResponse,
  unwrapBlogDetailResponse,
} from './blogService';
export { default as authService } from './authService';
export { default as candidateService } from './candidateService';
export { default as categoryService } from './categoryService';
export { default as chatbotService } from './chatbotService';
export { default as employerService } from './employerService';
export { default as jobService } from './jobService';
export { default as uploadService } from './uploadService';
export { default as userService } from './userService';
export { default as publicToolsService } from './publicToolsService';
export { default as resumeService } from './resumeService';
export { default as aiService } from './aiService';
export { default as featureCatalogService, getFeatureCatalog } from './featureCatalogService';
