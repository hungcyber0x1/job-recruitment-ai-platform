module.exports = {
  welcomeEmail: (name) => `
    <h1>Chào mừng ${name} đến với HireAI!</h1>
    <p>Cảm ơn bạn đã tham gia cộng đồng tuyển dụng thông minh của chúng tôi.</p>
  `,
  applicationStatusUpdate: (jobTitle, status) => `
    <p>Trạng thái đơn ứng tuyển cho vị trí <strong>${jobTitle}</strong> đã được cập nhật thành: <strong>${status}</strong>.</p>
  `,
  jobAlert: (companyName, jobTitle) => `
    <p>${companyName} vừa đăng một công việc mới: <strong>${jobTitle}</strong>. Kiểm tra ngay nhé!</p>
  `,
};
