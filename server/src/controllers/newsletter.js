const NewsletterSubscriptionRepository = require('../models/NewsletterSubscription');
const { ApiResponse } = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');

const RESULT_MESSAGES = {
  created: 'Đăng ký nhận bản tin thành công. HireBOT sẽ gửi nội dung chọn lọc vào email của bạn.',
  reactivated: 'Email đã được kích hoạt nhận bản tin trở lại.',
  already_subscribed: 'Email này đã có trong danh sách nhận bản tin.',
};

function resolveClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim().slice(0, 45);
  }

  return String(req.ip || req.socket?.remoteAddress || '').slice(0, 45) || null;
}

class NewsletterController {
  subscribe = catchAsync(async (req, res) => {
    const { email, source, topic, consent, consentText, metadata } = req.body || {};
    const normalizedEmail = NewsletterSubscriptionRepository.normalizeEmail(email);

    if (!NewsletterSubscriptionRepository.isValidEmail(normalizedEmail)) {
      return ApiResponse.badRequest(res, 'Vui lòng nhập địa chỉ email hợp lệ.');
    }

    if (consent !== true) {
      return ApiResponse.badRequest(res, 'Bạn cần đồng ý nhận bản tin trước khi gửi đăng ký.');
    }

    const { subscription, result } = await NewsletterSubscriptionRepository.subscribe({
      email: normalizedEmail,
      topic,
      source,
      consentText,
      ipAddress: resolveClientIp(req),
      userAgent: req.get('user-agent'),
      metadata,
    });

    const statusCode = result === 'created' ? 201 : 200;
    return ApiResponse.success(
      res,
      {
        email: normalizedEmail,
        topic: subscription?.topic || topic || 'weekly_hiring_insights',
        status: subscription?.status || 'subscribed',
        subscriptionStatus: result,
      },
      { message: RESULT_MESSAGES[result] || RESULT_MESSAGES.created },
      statusCode
    );
  });
}

module.exports = new NewsletterController();
