const fs = require('fs');
const messagingService = require('../services/messaging');
const { ApiResponse } = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');

const getConversations = catchAsync(async (req, res) => {
  const payload = await messagingService.listConversations(req.user, req.query);
  return ApiResponse.success(res, payload);
});

const startConversation = catchAsync(async (req, res) => {
  const payload = await messagingService.startConversation(req.user, req.body || {});
  return ApiResponse.created(res, payload, 'Conversation ready');
});

const openByApplication = catchAsync(async (req, res) => {
  const payload = await messagingService.openConversationByApplication(
    req.user,
    req.params.applicationId
  );
  return ApiResponse.success(res, payload);
});

const getConversation = catchAsync(async (req, res) => {
  const payload = await messagingService.getConversation(req.user, req.params.id, req.query);
  return ApiResponse.success(res, payload);
});

const sendMessage = catchAsync(async (req, res) => {
  const message = await messagingService.sendMessage(req.user, req.params.id, req.body || {});
  return ApiResponse.created(res, message, 'Message sent');
});

const sendAttachment = catchAsync(async (req, res) => {
  const message = await messagingService.sendAttachment(req.user, req.params.id, {
    body: req.body?.body,
    file: req.file,
  });
  return ApiResponse.created(res, message, 'Attachment sent');
});

const sendInterviewInvite = catchAsync(async (req, res) => {
  const message = await messagingService.sendInterviewInvite(
    req.user,
    req.params.id,
    req.body || {}
  );
  return ApiResponse.created(res, message, 'Interview invitation sent');
});

const sendJobInfo = catchAsync(async (req, res) => {
  const message = await messagingService.sendJobInfo(req.user, req.params.id, req.body || {});
  return ApiResponse.created(res, message, 'Job information sent');
});

const markRead = catchAsync(async (req, res) => {
  await messagingService.markRead(req.user, req.params.id);
  return ApiResponse.success(res, { message: 'Conversation marked as read' });
});

const archiveConversation = catchAsync(async (req, res) => {
  await messagingService.archiveConversation(req.user, req.params.id, req.body?.archived !== false);
  return ApiResponse.success(res, { message: 'Conversation archive state updated' });
});

const deleteConversation = catchAsync(async (req, res) => {
  await messagingService.deleteConversation(req.user, req.params.id);
  return ApiResponse.success(res, { message: 'Conversation removed from your inbox' });
});

const blockConversation = catchAsync(async (req, res) => {
  await messagingService.blockConversation(req.user, req.params.id, req.body?.blocked !== false);
  return ApiResponse.success(res, { message: 'Conversation block state updated' });
});

const getAttachment = catchAsync(async (req, res) => {
  const attachment = await messagingService.getAttachment(req.user, req.params.filename);
  if (!fs.existsSync(attachment.path)) {
    return ApiResponse.notFound(res, 'Attachment');
  }

  res.setHeader('Content-Type', attachment.mime);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${encodeURIComponent(attachment.name)}"`
  );
  return res.sendFile(attachment.path);
});

module.exports = {
  getConversations,
  startConversation,
  openByApplication,
  getConversation,
  sendMessage,
  sendAttachment,
  sendInterviewInvite,
  sendJobInfo,
  markRead,
  archiveConversation,
  deleteConversation,
  blockConversation,
  getAttachment,
};
