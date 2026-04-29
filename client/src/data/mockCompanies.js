/**
 * Dữ liệu mẫu danh sách công ty (trang /companies) — thay bằng API khi backend có endpoint công khai.
 * industryKey khớp với filter: cntt | marketing | finance | hr | design | education | medical | logistics
 */
export const MOCK_COMPANIES = [
  {
    id: 1,
    name: 'TechCorp Vietnam',
    slug: 'techcorp-vietnam',
    industryKey: 'cntt',
    industry: 'Công nghệ thông tin',
    location: 'Hà Nội, Vietnam',
    size: '500-1000',
    openPositions: 4,
    logo: 'https://i.pravatar.cc/150?u=techcorp',
    website: 'https://techcorp.vn',
    description: 'Công ty công nghệ hàng đầu Việt Nam, chuyên phát triển giải pháp phần mềm doanh nghiệp, AI và cloud computing.',
    featured: true,
  },
  {
    id: 2,
    name: 'Nextech Japan',
    slug: 'nextech-japan',
    industryKey: 'cntt',
    industry: 'Công nghệ thông tin',
    location: 'Hà Nội, Vietnam',
    size: '100-500',
    openPositions: 3,
    logo: 'https://i.pravatar.cc/150?u=nextech',
    website: 'https://nextech-japan.com',
    description: 'Công ty outsourcing IT chuyên nghiệp với dự án cho thị trường Nhật Bản. Văn hóa Nhật Bản chuyên nghiệp.',
    featured: true,
  },
  {
    id: 3,
    name: 'GreenLeaf Media',
    slug: 'greenleaf-media',
    industryKey: 'marketing',
    industry: 'Marketing / Truyền thông',
    location: 'TP. Hồ Chí Minh, Vietnam',
    size: '50-200',
    openPositions: 3,
    logo: 'https://i.pravatar.cc/150?u=greenleaf',
    website: 'https://greenleafmedia.vn',
    description: 'Agency marketing toàn diện, chuyên về digital marketing, content strategy và social media cho các thương hiệu lớn.',
    featured: true,
  },
  {
    id: 4,
    name: 'HRPro Solutions',
    slug: 'hrpro-solutions',
    industryKey: 'hr',
    industry: 'Nhân sự / Tuyển dụng',
    location: 'TP. Hồ Chí Minh, Vietnam',
    size: '20-100',
    openPositions: 2,
    logo: 'https://i.pravatar.cc/150?u=hrpro',
    website: 'https://hrpro.vn',
    description: 'Công ty headhunting và tuyển dụng chuyên nghiệp, đặc biệt trong lĩnh vực IT và finance. Network 50.000+ ứng viên.',
    featured: false,
  },
  {
    id: 5,
    name: 'EduFirst Vietnam',
    slug: 'edufirst-vietnam',
    industryKey: 'education',
    industry: 'Giáo dục / EdTech',
    location: 'Hà Nội, Vietnam',
    size: '100-500',
    openPositions: 2,
    logo: 'https://i.pravatar.cc/150?u=edufirst',
    website: 'https://edufirst.vn',
    description: 'Nền tảng EdTech hàng đầu Việt Nam, kết hợp AI vào giáo dục. Sản phẩm phục vụ hàng triệu học sinh.',
    featured: true,
  },
  {
    id: 6,
    name: 'MedHealth Tech',
    slug: 'medhealth-tech',
    industryKey: 'medical',
    industry: 'Y tế / HealthTech',
    location: 'TP. Hồ Chí Minh, Vietnam',
    size: '50-200',
    openPositions: 1,
    logo: 'https://i.pravatar.cc/150?u=medhealth',
    website: 'https://medhealth.vn',
    description: 'Startup HealthTech kết hợp AI vào chẩn đoán hình ảnh và quản lý bệnh viện. Series A funded.',
    featured: false,
  },
  {
    id: 7,
    name: 'LogiFast Vietnam',
    slug: 'logifast-vietnam',
    industryKey: 'logistics',
    industry: 'Logistics / Chuỗi cung ứng',
    location: 'Bình Dương, Vietnam',
    size: '200-500',
    openPositions: 2,
    logo: 'https://i.pravatar.cc/150?u=logifast',
    website: 'https://logifast.vn',
    description: 'Công ty logistics hiện đại, ứng dụng công nghệ vào quản lý chuỗi cung ứng và vận chuyển.',
    featured: false,
  },
  {
    id: 8,
    name: 'FinanceHub',
    slug: 'financehub',
    industryKey: 'finance',
    industry: 'Tài chính / Fintech',
    location: 'Hà Nội, Vietnam',
    size: '100-500',
    openPositions: 1,
    logo: 'https://i.pravatar.cc/150?u=financehub',
    website: 'https://financehub.vn',
    description: 'Nền tảng Fintech kết nối người vay và nhà đầu tư. Sử dụng AI scoring và blockchain.',
    featured: false,
  },
  {
    id: 9,
    name: 'DesignLab Studio',
    slug: 'designlab-studio',
    industryKey: 'design',
    industry: 'Thiết kế / Creative',
    location: 'TP. Hồ Chí Minh, Vietnam',
    size: '10-50',
    openPositions: 1,
    logo: 'https://i.pravatar.cc/150?u=designlab',
    website: 'https://designlab.vn',
    description: 'Studio thiết kế sáng tạo, chuyên về branding, UX/UI và motion graphics. Clients: startup & enterprise.',
    featured: false,
  },
  {
    id: 10,
    name: 'RetailPro',
    slug: 'retailpro',
    industryKey: 'logistics',
    industry: 'Bán lẻ / Retail',
    location: 'TP. Hồ Chí Minh, Vietnam',
    size: '500-1000',
    openPositions: 2,
    logo: 'https://i.pravatar.cc/150?u=retailpro',
    website: 'https://retailpro.vn',
    description: 'Chuỗi bán lẻ lớn với hệ thống 200+ cửa hàng toàn quốc. Đang chuyển đổi số mạnh mẽ.',
    featured: false,
  },
];

export function getMockCompanyById(id) {
  const n = Number(id);
  return MOCK_COMPANIES.find((c) => c.id === n) || null;
}

export function getMockCompanyBySlug(slug) {
  return MOCK_COMPANIES.find((c) => c.slug === slug) || null;
}

export function getFeaturedCompanies() {
  return MOCK_COMPANIES.filter((c) => c.featured);
}

export function getCompaniesByIndustry(industryKey) {
  if (!industryKey || industryKey === 'all') return MOCK_COMPANIES;
  return MOCK_COMPANIES.filter((c) => c.industryKey === industryKey);
}
