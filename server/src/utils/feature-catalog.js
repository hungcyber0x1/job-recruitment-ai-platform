const DEFAULT_FEATURE_CATALOG = {
  roleGroups: [
    {
      id: 'admin',
      eyebrow: 'Quản trị',
      title: 'Quản trị nền tảng và kiểm soát vận hành',
      summary:
        'Dashboard cho người dùng, tin tuyển dụng, hồ sơ ứng tuyển, kiểm duyệt, phân tích, sức khỏe hệ thống và cấu hình.',
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
        'Đối chiếu CV với mô tả công việc, nhận diện khoảng trống kỹ năng và gợi ý cải thiện.',
      path: '/ai-cv-scanner',
      settingKey: 'ai_resume_analysis',
      enabled: true,
    },
    {
      id: 'salary-predictor',
      title: 'Ước tính lương',
      description:
        'Ước tính xu hướng đãi ngộ dựa trên kỹ năng, tín hiệu thị trường và hồ sơ vị trí.',
      path: '/salary-predictor',
      enabled: true,
    },
  ],
  governanceSignals: [
    'Dashboard theo vai trò',
    'Xác minh doanh nghiệp',
    'Quy trình kiểm duyệt',
    'Theo dõi sức khỏe dịch vụ',
    'Feature flag và thiết lập hệ thống',
    'Lớp tư vấn AI',
  ],
};

const toBoolean = (value, fallback = true) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return fallback;
};

const deepClone = (value) => JSON.parse(JSON.stringify(value));

const isSupportedPublicTool = (tool) =>
  tool?.id !== 'career-roadmap' && tool?.path !== '/candidate/career-roadmap';

const buildFeatureCatalog = ({ settingsMap = {}, payload = null } = {}) => {
  const base =
    payload && typeof payload === 'object' ? payload : deepClone(DEFAULT_FEATURE_CATALOG);

  if (Array.isArray(base.publicTools)) {
    base.publicTools = base.publicTools.filter(isSupportedPublicTool).map((tool) => ({
      ...tool,
      enabled:
        tool.settingKey && Object.prototype.hasOwnProperty.call(settingsMap, tool.settingKey)
          ? toBoolean(settingsMap[tool.settingKey], tool.enabled !== false)
          : tool.enabled !== false,
    }));
  }

  return base;
};

module.exports = {
  DEFAULT_FEATURE_CATALOG,
  buildFeatureCatalog,
};
