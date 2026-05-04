const aiService = require('../services/ai');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/errorHandler');

/**
 * Controller for AI-related operations
 */
class AIController {
  /**
   * Generates a job description based on job title and category
   */
  generateJD = catchAsync(async (req, res, next) => {
    const { title, category, company_name } = req.body;

    if (!title) {
      return next(new AppError('Vui lòng cung cấp chức danh công việc để tạo nội dung.', 400));
    }

    const prompt = `Bạn là một chuyên gia tuyển dụng tại Việt Nam. 
Hãy viết một bản mô tả công việc (Job Description) chuyên nghiệp, thu hút cho vị trí:
- Chức danh: ${title}
- Lĩnh vực: ${category || 'Công nghệ thông tin'}
${company_name ? `- Công ty: ${company_name}` : ''}

Yêu cầu bản JD bao gồm các phần sau (viết bằng tiếng Việt):
1. Giới thiệu ngắn về vị trí.
2. Trách nhiệm công việc (Job Responsibilities).
3. Yêu cầu công việc (Job Requirements/Qualifications).
4. Quyền lợi và phúc lợi (Benefits).

Định dạng văn bản theo Markdown để dễ hiển thị.`;

    try {
      const content = await aiService.generateContent(prompt);

      res.status(200).json({
        success: true,
        data: content,
      });
    } catch (error) {
      console.error('AI Controller Error:', error);
      return next(
        new AppError(
          'Không thể tạo mô tả công việc tự động ngay lúc này. Vui lòng thử lại sau.',
          500
        )
      );
    }
  });
}

module.exports = new AIController();
