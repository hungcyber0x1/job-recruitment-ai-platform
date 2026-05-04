export const fallbackFeatureCatalog = {
  roleGroups: [
    {
      id: 'admin',
      eyebrow: 'Quản trị',
      title: 'Quản trị nền tảng và kiểm soát vận hành',
      summary:
        'Tổng quan cho người dùng, tin tuyển dụng, hồ sơ ứng tuyển, kiểm duyệt, phân tích, sức khỏe hệ thống và cấu hình.',
      items: [
        'Quản lý người dùng, doanh nghiệp và hồ sơ ứng tuyển',
        'Kiểm duyệt tin tuyển dụng, danh mục, kỹ năng và chatbot',
        'Phân tích dữ liệu, ticket hỗ trợ, nhật ký, sức khỏe dịch vụ và thiết lập hệ thống',
      ],
    },
    {
      id: 'employer',
      eyebrow: 'Nhà tuyển dụng',
      title: 'Triển khai tuyển dụng và phối hợp ứng viên',
      summary:
        'Không gian làm việc cho nhà tuyển dụng: đăng tin, theo dõi pipeline, trao đổi và xây dựng thương hiệu tuyển dụng.',
      items: [
        'Đăng tin, chỉnh sửa vị trí và kiểm soát pipeline tuyển dụng',
        'Tìm kiếm ứng viên, lưu hồ sơ tiềm năng và nhắn tin trực tiếp',
        'Đặt lịch phỏng vấn và quản lý hồ sơ công ty',
      ],
    },
    {
      id: 'candidate',
      eyebrow: 'Ứng viên',
      title: 'Khám phá nghề nghiệp, chuẩn bị hồ sơ và tư vấn AI',
      summary:
        'Không gian ứng viên tập trung vào hoàn thiện hồ sơ, theo dõi ứng tuyển, nhận tư vấn AI và định hướng phát triển.',
      items: [
        'Quản lý hồ sơ, CV và thiết lập tài khoản',
        'Khám phá việc làm, lưu tin và theo dõi trạng thái ứng tuyển',
        'Nhận thông báo, khám phá doanh nghiệp và sử dụng công cụ định hướng nghề nghiệp',
      ],
    },
  ],
  publicTools: [
    {
      id: 'ai-cv-scanner',
      title: 'Quét CV bằng AI',
      description:
        'Kiểm tra CV dành cho ứng viên trước khi ứng tuyển trên HireBOT: từ khóa, tín hiệu ATS và gợi ý cải thiện.',
      path: '/ai-cv-scanner',
      enabled: true,
    },
    {
      id: 'salary-predictor',
      title: 'Ước tính lương',
      description:
        'Tham khảo dải lương theo vị trí, kinh nghiệm, ngành nghề và địa điểm để chuẩn bị đàm phán offer.',
      path: '/salary-predictor',
      enabled: true,
    },
  ],
  governanceSignals: [
    'Tổng quan theo vai trò',
    'Xác minh doanh nghiệp',
    'Quy trình kiểm duyệt',
    'Theo dõi sức khỏe dịch vụ',
    'Feature flag và thiết lập hệ thống',
    'Lớp tư vấn AI',
  ],
};
