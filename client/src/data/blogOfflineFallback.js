/**
 * Bài mẫu khi API blog không khả dụng — dùng chung BlogPage + BlogPostPage.
 */
export const OFFLINE_BLOG_LIST = [
  {
    id: 1,
    slug: 'top-5-ky-nang-ai-cho-developer-nam-2026',
    title: 'Top 5 kỹ năng trí tuệ nhân tạo cần thiết cho lập trình viên năm 2026',
    excerpt:
      'Trí tuệ nhân tạo đang thay đổi cách chúng ta lập trình. Khám phá những công cụ và kỹ năng bạn cần trang bị để không bị bỏ lại phía sau.',
    image:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800',
    author: 'Minh Anh',
    date: '28/12/2026',
    category: 'Công nghệ',
    viewCount: 0,
  },
  {
    id: 2,
    slug: 'viet-cv-chuan-ats-bi-quyet-vuot-qua-vong-loc-ho-so-tu-dong',
    title: 'Viết CV chuẩn ATS: Bí quyết vượt qua vòng lọc hồ sơ tự động',
    excerpt:
      'Hệ thống lọc hồ sơ tự động hoạt động như thế nào? Cách tối ưu hóa từ khóa để CV của bạn luôn lọt vào mắt xanh nhà tuyển dụng.',
    image:
      'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=800',
    author: 'Sarah Nguyen',
    date: '25/12/2026',
    category: 'Mẹo nghề nghiệp',
    viewCount: 0,
  },
  {
    id: 3,
    slug: 'marketing-digital-viet-nam-2026-nganh-nao-dang-hot',
    title: 'Tiếp thị số 2026: Ngành nào đang “nóng” về nhu cầu nhân sự?',
    excerpt: 'Hiệu suất quảng cáo, quản lý quan hệ khách hàng và video ngắn — nhu cầu tuyển dụng theo từng lĩnh vực.',
    image:
      'https://images.unsplash.com/photo-1533750516457-a7f992034fec?auto=format&fit=crop&q=80&w=800',
    author: 'Ban biên tập',
    date: '22/12/2026',
    category: 'Marketing & Truyền thông',
    viewCount: 0,
  },
  {
    id: 4,
    slug: 'green-jobs-va-esg-trong-tuyen-dung',
    title: 'Việc làm xanh và ESG: Câu hỏi phỏng vấn về bền vững',
    excerpt: 'Báo cáo phát thải, năng lượng tái tạo và trách nhiệm xã hội doanh nghiệp.',
    image:
      'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=800',
    author: 'Ban biên tập',
    date: '18/12/2026',
    category: 'Bền vững & ESG',
    viewCount: 0,
  },
  {
    id: 5,
    slug: 'xu-huong-it-2026',
    title: 'Xu hướng công nghệ thông tin 2026 tại Việt Nam',
    excerpt: 'Điện toán đám mây hiện đại, trí tuệ nhân tạo và bảo mật tiếp tục dẫn dắt nhu cầu tuyển dụng.',
    image:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800',
    author: 'Ban biên tập',
    date: '20/12/2026',
    category: 'Góc nhìn thị trường',
    viewCount: 0,
  },
  {
    id: 6,
    slug: 'phong-van-star',
    title: 'Phương pháp STAR trong phỏng vấn hành vi',
    excerpt: 'Cách kể câu chuyện có số liệu để gây ấn tượng với bộ phận nhân sự.',
    image:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800',
    author: 'Đội ngũ nhân sự',
    date: '18/12/2026',
    category: 'Phỏng vấn',
    viewCount: 0,
  },
];

function avatarUrl(name) {
  const n = encodeURIComponent((name || 'A').trim() || 'HireBOT');
  return `https://ui-avatars.com/api/?name=${n}&background=0D8ABC&color=fff`;
}

/**
 * Tạo object bài chi tiết từ danh sách offline (khi không có API).
 */
export function buildOfflinePostDetail(slug) {
  const p = OFFLINE_BLOG_LIST.find((x) => x.slug === slug);
  if (!p) return null;
  return {
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    content: `<p class="lead">${p.excerpt}</p><p><em>Nội dung đầy đủ sẽ hiển thị khi kết nối máy chủ.</em></p>`,
    image: p.image,
    author: p.author,
    date: p.date,
    category: p.category,
    avatar: avatarUrl(p.author),
    authorType: 'admin',
    companyName: null,
    publishedAt: null,
    viewCount: p.viewCount ?? 0,
  };
}
