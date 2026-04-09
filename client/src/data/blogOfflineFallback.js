/**
 * Bài mẫu khi API blog không khả dụng — dùng chung BlogPage + BlogPostPage.
 */
export const OFFLINE_BLOG_LIST = [
  {
    id: 1,
    slug: 'top-5-ky-nang-ai-cho-developer-nam-2026',
    title: 'Top 5 Kỹ năng AI cần thiết cho Developer năm 2026',
    excerpt:
      'Trí tuệ nhân tạo đang thay đổi cách chúng ta lập trình. Khám phá những công cụ và kỹ năng bạn cần trang bị để không bị bỏ lại phía sau.',
    image:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800',
    author: 'Minh Anh',
    date: '28/12/2026',
    category: 'Technology',
    viewCount: 0,
  },
  {
    id: 2,
    slug: 'viet-cv-chuan-ats-bi-quyet-vuot-qua-vong-loc-ho-so-tu-dong',
    title: 'Viết CV chuẩn ATS: Bí quyết vượt qua vòng lọc hồ sơ tự động',
    excerpt:
      'Hệ thống ATS (Applicant Tracking System) hoạt động như thế nào? Cách tối ưu hóa từ khóa để CV của bạn luôn lọt vào mắt xanh nhà tuyển dụng.',
    image:
      'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=800',
    author: 'Sarah Nguyen',
    date: '25/12/2026',
    category: 'Career Tips',
    viewCount: 0,
  },
  {
    id: 3,
    slug: 'marketing-digital-viet-nam-2026-nganh-nao-dang-hot',
    title: 'Marketing digital 2026: Ngành nào đang “hot” nhân sự?',
    excerpt: 'Performance, CRM và short-form video — nhu cầu tuyển theo từng vertical.',
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
    title: 'Green jobs & ESG: Câu hỏi phỏng vấn về bền vững',
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
    title: 'Xu hướng IT 2026 tại Việt Nam',
    excerpt: 'Cloud-native, AI và bảo mật tiếp tục dẫn dắt nhu cầu tuyển dụng.',
    image:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800',
    author: 'Ban biên tập',
    date: '20/12/2026',
    category: 'Market Insights',
    viewCount: 0,
  },
  {
    id: 6,
    slug: 'phong-van-star',
    title: 'STAR method trong phỏng vấn hành vi',
    excerpt: 'Cách kể câu chuyện có số liệu để gây ấn tượng với HR.',
    image:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800',
    author: 'HR Team',
    date: '18/12/2026',
    category: 'Interview',
    viewCount: 0,
  },
];

function avatarUrl(name) {
  const n = encodeURIComponent((name || 'A').trim() || 'HireAI');
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
