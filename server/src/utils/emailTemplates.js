/**
 * Email Templates — Rich HTML cho pipeline tuyển dụng
 * Mỗi function trả về HTML string đầy đủ.
 */

const BRAND_COLOR  = '#10b981'; // emerald-500
const BRAND_NAME   = 'HireBOT';
const CLIENT_URL   = process.env.CLIENT_URL || 'http://localhost:5173';

/** Shared wrapper để đảm bảo tất cả email trông nhất quán */
function wrapEmail(content) {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>HireBOT</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
        <!-- Header -->
        <tr>
          <td style="background:${BRAND_COLOR};padding:28px 40px;">
            <span style="color:#fff;font-size:22px;font-weight:700;letter-spacing:-.5px;">⚡ ${BRAND_NAME}</span>
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:36px 40px 32px;">${content}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
              Email này được gửi tự động từ hệ thống <strong>${BRAND_NAME}</strong>.<br/>
              Vui lòng không trả lời email này. Nếu cần hỗ trợ, liên hệ qua nền tảng.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function primaryButton(text, url) {
  return `<a href="${url}" style="display:inline-block;background:${BRAND_COLOR};color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;font-size:15px;margin-top:20px;">${text}</a>`;
}

function statusBadge(label, bgColor, textColor) {
  return `<span style="display:inline-block;background:${bgColor};color:${textColor};padding:4px 14px;border-radius:20px;font-size:13px;font-weight:600;">${label}</span>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Templates cho candidate
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Email chào mừng khi đăng ký
 */
module.exports.welcomeEmail = (name) => wrapEmail(`
  <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;">Chào mừng ${name}! 🎉</h2>
  <p style="color:#475569;line-height:1.7;margin:0 0 20px;">
    Cảm ơn bạn đã tham gia <strong>${BRAND_NAME}</strong> — nền tảng tuyển dụng thông minh với sức mạnh AI.
    Bắt đầu tìm kiếm cơ hội nghề nghiệp phù hợp với bạn ngay hôm nay!
  </p>
  ${primaryButton('Khám phá việc làm', `${CLIENT_URL}/jobs`)}
`);

/**
 * Email khi ứng viên nộp đơn thành công → gửi cho candidate
 */
module.exports.applicationSubmitted = (candidateName, jobTitle, companyName) => wrapEmail(`
  <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;">Đơn ứng tuyển đã được gửi ✅</h2>
  <p style="color:#475569;line-height:1.7;margin:0 0 16px;">
    Xin chào <strong>${candidateName}</strong>,
  </p>
  <p style="color:#475569;line-height:1.7;margin:0 0 20px;">
    Đơn ứng tuyển của bạn cho vị trí <strong>${jobTitle}</strong> tại <strong>${companyName}</strong>
    đã được gửi thành công. Nhà tuyển dụng sẽ liên hệ với bạn sớm nhất có thể.
  </p>
  ${primaryButton('Theo dõi đơn ứng tuyển', `${CLIENT_URL}/candidate/applications`)}
`);

/**
 * Email khi lịch phỏng vấn được sắp xếp → gửi cho candidate
 */
module.exports.interviewScheduled = ({ candidateName, jobTitle, companyName, scheduledAt, interviewType, location, candidateNote, round }) => {
  const typeLabels = { online: '🖥️ Online', offline: '🏢 Tại văn phòng', phone: '📞 Qua điện thoại' };
  const typeLabel  = typeLabels[interviewType] || interviewType;

  const dateStr = scheduledAt
    ? new Date(scheduledAt).toLocaleString('vi-VN', { dateStyle: 'full', timeStyle: 'short' })
    : 'Chưa xác định';

  return wrapEmail(`
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;">Lịch phỏng vấn vòng ${round || 1} 📅</h2>
    <p style="color:#475569;line-height:1.7;margin:0 0 16px;">
      Xin chào <strong>${candidateName}</strong>,<br/>
      Chúc mừng! Bạn đã được mời phỏng vấn cho vị trí <strong>${jobTitle}</strong> tại <strong>${companyName}</strong>.
    </p>

    <table style="width:100%;border-collapse:collapse;margin:0 0 24px;border-radius:10px;overflow:hidden;">
      <tr style="background:#f0fdf4;">
        <td style="padding:12px 16px;font-weight:600;color:#064e3b;width:40%;">📅 Thời gian</td>
        <td style="padding:12px 16px;color:#0f172a;">${dateStr}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-weight:600;color:#075985;background:#f0f9ff;">💼 Hình thức</td>
        <td style="padding:12px 16px;color:#0f172a;background:#f0f9ff;">${typeLabel}</td>
      </tr>
      ${location ? `<tr style="background:#fafafa;">
        <td style="padding:12px 16px;font-weight:600;color:#374151;">📍 Địa điểm/Link</td>
        <td style="padding:12px 16px;color:#0f172a;">${location}</td>
      </tr>` : ''}
    </table>

    ${candidateNote ? `<div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:24px;">
      <strong style="color:#92400e;">Lưu ý từ nhà tuyển dụng:</strong>
      <p style="color:#78350f;margin:6px 0 0;">${candidateNote}</p>
    </div>` : ''}

    ${primaryButton('Xem chi tiết đơn ứng tuyển', `${CLIENT_URL}/candidate/applications`)}
  `);
};

/**
 * Email khi nhận được offer → gửi cho candidate
 */
module.exports.offerReceived = ({ candidateName, jobTitle, companyName, salaryOffered, responseDeadline, startDate, notes }) => {
  const salaryStr  = salaryOffered
    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(salaryOffered)
    : 'Thỏa thuận';
  const deadlineStr = responseDeadline
    ? new Date(responseDeadline).toLocaleDateString('vi-VN')
    : 'Liên hệ recruiter';
  const startStr   = startDate
    ? new Date(startDate).toLocaleDateString('vi-VN')
    : 'Thỏa thuận';

  return wrapEmail(`
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;">🎉 Bạn nhận được đề nghị tuyển dụng!</h2>
    <p style="color:#475569;line-height:1.7;margin:0 0 16px;">
      Xin chào <strong>${candidateName}</strong>,<br/>
      Nhà tuyển dụng <strong>${companyName}</strong> đã gửi đề nghị tuyển dụng cho vị trí <strong>${jobTitle}</strong>.
    </p>

    <table style="width:100%;border-collapse:collapse;margin:0 0 24px;border-radius:10px;overflow:hidden;">
      <tr style="background:#f0fdf4;">
        <td style="padding:12px 16px;font-weight:600;color:#064e3b;width:40%;">💰 Mức lương</td>
        <td style="padding:12px 16px;color:#0f172a;"><strong>${salaryStr}</strong></td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-weight:600;color:#374151;background:#fafafa;">⏳ Hạn phản hồi</td>
        <td style="padding:12px 16px;color:#0f172a;background:#fafafa;">${deadlineStr}</td>
      </tr>
      <tr style="background:#f0fdf4;">
        <td style="padding:12px 16px;font-weight:600;color:#064e3b;">📆 Ngày bắt đầu</td>
        <td style="padding:12px 16px;color:#0f172a;">${startStr}</td>
      </tr>
    </table>

    ${notes ? `<div style="background:#f0fdf4;border-left:4px solid ${BRAND_COLOR};padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:24px;">
      <strong style="color:#064e3b;">Ghi chú từ nhà tuyển dụng:</strong>
      <p style="color:#374151;margin:6px 0 0;">${notes}</p>
    </div>` : ''}

    <p style="color:#64748b;font-size:14px;margin-bottom:24px;">
      Vui lòng phản hồi trước hạn chót để đảm bảo vị trí được giữ cho bạn.
    </p>
    ${primaryButton('Xem và phản hồi offer', `${CLIENT_URL}/candidate/applications`)}
  `);
};

/**
 * Email khi đơn bị từ chối → gửi cho candidate
 */
module.exports.applicationRejected = ({ candidateName, jobTitle, companyName, notes }) => wrapEmail(`
  <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;">Kết quả đơn ứng tuyển</h2>
  <p style="color:#475569;line-height:1.7;margin:0 0 16px;">
    Xin chào <strong>${candidateName}</strong>,
  </p>
  <p style="color:#475569;line-height:1.7;margin:0 0 16px;">
    Rất tiếc, sau khi xem xét kỹ lưỡng, <strong>${companyName}</strong> thông báo rằng 
    đơn ứng tuyển của bạn cho vị trí <strong>${jobTitle}</strong> chưa phù hợp với yêu cầu 
    ở thời điểm này.
  </p>
  ${notes ? `<div style="background:#fef2f2;border-left:4px solid #ef4444;padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:24px;">
    <strong style="color:#991b1b;">Nhận xét từ nhà tuyển dụng:</strong>
    <p style="color:#7f1d1d;margin:6px 0 0;">${notes}</p>
  </div>` : ''}
  <p style="color:#475569;line-height:1.7;margin:0 0 24px;">
    Đừng nản chí! Hãy tiếp tục khám phá các cơ hội khác phù hợp với bạn. 💪
  </p>
  ${primaryButton('Tìm việc làm khác', `${CLIENT_URL}/jobs`)}
`);

/**
 * Email khi ứng viên được tuyển (hired) → gửi cho candidate
 */
module.exports.applicationHired = ({ candidateName, jobTitle, companyName }) => wrapEmail(`
  <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;">🎊 Chúc mừng, bạn đã được tuyển!</h2>
  <p style="color:#475569;line-height:1.7;margin:0 0 16px;">
    Xin chào <strong>${candidateName}</strong>,<br/>
    <strong>${companyName}</strong> xác nhận rằng bạn đã chính thức được tuyển dụng 
    cho vị trí <strong>${jobTitle}</strong>. Chào mừng đến với hành trình mới!
  </p>
  <p style="color:#475569;line-height:1.7;margin:0 0 24px;">
    Nhà tuyển dụng sẽ liên hệ với bạn sớm về các bước onboarding tiếp theo.
  </p>
  ${primaryButton('Xem hồ sơ của bạn', `${CLIENT_URL}/candidate/profile`)}
`);

// ─────────────────────────────────────────────────────────────────────────────
// Templates cho recruiter
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Email khi ứng viên mới nộp đơn → gửi cho recruiter
 */
module.exports.newApplicantNotify = ({ recruiterName, candidateName, jobTitle, applicationId }) => wrapEmail(`
  <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;">Ứng viên mới ứng tuyển 📥</h2>
  <p style="color:#475569;line-height:1.7;margin:0 0 16px;">
    Xin chào <strong>${recruiterName || 'Nhà tuyển dụng'}</strong>,<br/>
    <strong>${candidateName}</strong> vừa nộp đơn ứng tuyển cho vị trí <strong>${jobTitle}</strong>.
  </p>
  ${primaryButton('Xem hồ sơ ứng viên', `${CLIENT_URL}/employer/applications/${applicationId}`)}
`);

/**
 * Email thông báo ứng viên rút đơn → gửi cho recruiter
 */
module.exports.applicationWithdrawn = ({ recruiterName, candidateName, jobTitle }) => wrapEmail(`
  <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;">Ứng viên đã rút đơn</h2>
  <p style="color:#475569;line-height:1.7;margin:0 0 16px;">
    Xin chào <strong>${recruiterName || 'Nhà tuyển dụng'}</strong>,<br/>
    <strong>${candidateName}</strong> vừa rút đơn ứng tuyển cho vị trí <strong>${jobTitle}</strong>.
  </p>
  ${primaryButton('Xem pipeline tuyển dụng', `${CLIENT_URL}/employer/applicants`)}
`);

// ─────────────────────────────────────────────────────────────────────────────
// Legacy exports (giữ nguyên để không break existing code)
// ─────────────────────────────────────────────────────────────────────────────
module.exports.welcomeEmailTemplate = module.exports.welcomeEmail;
module.exports.applicationStatusTemplate = (jobTitle, status) => `
  <p>Trạng thái đơn ứng tuyển cho vị trí <strong>${jobTitle}</strong> đã được cập nhật thành: <strong>${status}</strong>.</p>
`;
module.exports.accountApproved = (name) => `
  <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
    <h2 style="color: #10b981;">Chúc mừng ${name}! Tài khoản nhà tuyển dụng của bạn đã được phê duyệt.</h2>
    <p>Chào bạn,</p>
    <p>HireBOT rất vui mừng thông báo rằng tài khoản nhà tuyển dụng của bạn đã được xác minh thành công bởi đội ngũ quản trị viên.</p>
    <p>Bây giờ bạn đã có thể:</p>
    <ul>
      <li>Đăng tin tuyển dụng không giới hạn.</li>
      <li>Tiếp cận mạng lưới ứng viên chất lượng cao.</li>
      <li>Sử dụng các công cụ AI hỗ trợ phân tích hồ sơ.</li>
    </ul>
    <p>Hãy bắt đầu hành trình tìm kiếm nhân tài của bạn ngay hôm nay!</p>
    <div style="margin-top: 30px;">
      <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/login" 
         style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        Đăng nhập ngay
      </a>
    </div>
    <p style="margin-top: 40px; font-size: 0.8em; color: #666;">
      Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với bộ phận hỗ trợ của chúng tôi.<br>
      Trân trọng,<br>
      Đội ngũ HireBOT
    </p>
  </div>
`;
