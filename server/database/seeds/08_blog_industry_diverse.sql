-- Seed 08: Tạp chí mở rộng — đa ngành nghề, chủ đề xã hội & nghề nghiệp
-- Cần bảng blog_posts + cột view_count (035). Chạy sau 07. Admin: admin@hireai.vn

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT 'hop-dong-thu-viec-va-quyen-loi-nguoi-lao-dong',
  'Hợp đồng thử việc: Quyền lợi người lao động cần biết năm 2026',
  'Thời hạn thử việc, mức lương tối thiểu và khi nào doanh nghiệp được chấm dứt hợp đồng — tóm tắt thực tiễn.',
  '<p class="lead">Thử việc là giai đoạn hai bên đánh giá sự phù hợp, nhưng không phải “giai đoạn không có luật”. Người lao động vẫn được hưởng các quy định tối thiểu về thời gian làm việc, nghỉ phép và bảo hiểm theo quy định hiện hành.</p><h2>Thời hạn và mức trả</h2><p>Thời hạn thử việc phụ thuộc loại hợp đồng và vị trí; doanh nghiệp cần ghi rõ trong hợp đồng. Mức lương thử việc không được thấp hơn tỷ lệ tối thiểu theo quy định (nếu áp dụng).</p><h2>Kết thúc thử việc</h2><p>Khi chấm dứt, bên phải tuân thủ thời hạn báo trước và lý do theo đúng pháp luật lao động. Ứng viên nên giữ bản hợp đồng và email xác nhận.</p><div class="article-callout"><p><strong>Gợi ý</strong></p><p>Nếu có thắc mắc, ưu tiên đối chiếu với Cổng thông tin Bộ LĐ-TB&amp;XH hoặc tư vấn pháp lý chuyên ngành.</p></div>',
  'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=1200',
  'Pháp lý & Quyền lợi', 'admin', u.id, NULL, 1, DATE_SUB(NOW(), INTERVAL 22 DAY), 612
FROM users u WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin' LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT 'marketing-digital-viet-nam-2026-nganh-nao-dang-hot',
  'Marketing digital tại Việt Nam 2026: Ngành nào đang “hot” nhân sự?',
  'Performance, CRM, short-form video và AI content — nhu cầu tuyển theo từng vertical.',
  '<p>Thị trường tiếp thị số Việt Nam tiếp tục phân hóa: thương mại điện tử và F&amp;B đẩy mạnh performance; B2B tăng đầu tư vào demand gen và marketing ops.</p><h2>Vị trí được săn đón</h2><p>Chuyên viên growth, CRM (Salesforce/HubSpot), và producer nội dung ngắn (Reels, Shorts) có nhu cầu ổn định. Kỹ năng đọc số liệu (GA4, dashboard) là điểm cộng lớn.</p><h2>AI trong team marketing</h2><p>AI hỗ trợ brainstorm, A/B test copy và tóm tắt insight — nhưng chiến lược thương hiệu và hiểu khách hàng vẫn là con người.</p><div class="article-callout"><p><strong>Portfolio</strong></p><p>Case có số liệu CTR, CPA hoặc pipeline ảnh hưởng sẽ nổi bật hơn slide mô tả chung chung.</p></div>',
  'https://images.unsplash.com/photo-1533750516457-a7f992034fec?auto=format&fit=crop&q=80&w=1200',
  'Marketing & Truyền thông', 'admin', u.id, NULL, 1, DATE_SUB(NOW(), INTERVAL 24 DAY), 534
FROM users u WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin' LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT 'fintech-viet-nam-data-va-tuan-thu',
  'Fintech Việt Nam: Nghề nghiệp ở giao điểm dữ liệu và tuân thủ',
  'Từ risk analyst đến product owner thanh toán — kỹ năng và chứng chỉ thường gặp.',
  '<p>Ngành dịch vụ tài chính số mở rộng dịch vụ cho cá nhân và SME; song song đó là yêu cầu tuân thủ, bảo mật và báo cáo.</p><h2>Vai trò phổ biến</h2><p>Phân tích rủi ro tín dụng, vận hành sản phẩm thanh toán, và các vị trí liên quan KYC/AML cần hiểu quy trình và công cụ.</p><h2>Lộ trình học</h2><p>Nền tảng tài chính doanh nghiệp, SQL/Python cơ bản, và quen thuộc với khung quản trị dữ liệu cá nhân là bước khởi đầu tốt.</p>',
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=1200',
  'Tài chính & Ngân hàng', 'admin', u.id, NULL, 1, DATE_SUB(NOW(), INTERVAL 26 DAY), 488
FROM users u WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin' LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT 'y-te-so-va-nghe-nghiep-cham-soc',
  'Y tế số và nghề nghiệp chăm sóc: Cơ hội bên ngoài bệnh viện',
  'Telehealth, phần mềm hồ sơ bệnh án và vai trò điều phối dữ liệu y tế.',
  '<p>Chuyển đổi số trong y tế không chỉ là thiết bị mà còn là quy trình và con người vận hành hệ thống.</p><h2>Vị trí liên ngành</h2><p>Chuyên viên triển khai phần mềm lâm sàng, điều phối dự án CDSS, và các vai trò “clinical informatics” cần vừa hiểu quy trình bệnh viện vừa giao tiếp tốt với IT.</p><h2>Đạo đức & dữ liệu</h2><p>Xử lý dữ liệu sức khỏe đòi hỏi kỷ luật bảo mật và đồng ý bệnh nhân — đây là phần phỏng vấn thường được hỏi sâu.</p>',
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=1200',
  'Y tế & Sức khỏe nghề nghiệp', 'admin', u.id, NULL, 1, DATE_SUB(NOW(), INTERVAL 28 DAY), 421
FROM users u WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin' LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT 'giao-duc-edtech-va-nghe-toi-day-hoc-online',
  'EdTech và nghề “dạy học online”: Thiết kế bài giảng, mentor, học liệu số',
  'Nhu cầu học kỹ năng ngắn hạn và chứng chỉ tăng — ai đang được tuyển?',
  '<p>Nền tảng học trực tuyến và bootcamp kỹ năng tuyển instructional designer, facilitator và chuyên viên chất lượng học liệu.</p><h2>Kỹ năng cốt lõi</h2><p>Soạn outline bài học theo mục tiêu hành vi, đánh giá năng lực (rubric), và làm việc với video/editor — không nhất thiết phải là giảng viên đại học truyền thống.</p><div class="article-callout"><p><strong>Xu hướng</strong></p><p>Micro-credential và học theo dự án (project-based) được nhiều nhà tuyển dụng công nhận hơn so với chỉ giấy chứng nhận dài hạn.</p></div>',
  'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1200',
  'Giáo dục & Đào tạo', 'admin', u.id, NULL, 1, DATE_SUB(NOW(), INTERVAL 30 DAY), 395
FROM users u WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin' LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT 'logistics-va-chuoi-cung-ung-bien-dong-toan-cau',
  'Logistics & chuỗi cung ứng: Biến động toàn cầu và việc làm tại Việt Nam',
  'Tối ưu kho, last-mile và số hóa vận hành — năng lực được tìm kiếm.',
  '<p>Doanh nghiệp sản xuất và bán lẻ tiếp tục đầu tư vào WMS, dự báo nhu cầu và đa kênh.</p><h2>Vai trò nổi bật</h2><p>Quản lý kho, điều phối vận tải, và phân tích chi phí logistics (cost-to-serve) là các vị trí có nhu cầu ổn định tại các tỉnh trọng điểm.</p><h2>Kỹ năng số</h2><p>Excel/SQL cơ bản, làm việc với dashboard và hiểu chỉ số OTIF giúp bạn vượt qua vòng phỏng vấn vận hành.</p>',
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=1200',
  'Logistics & Chuỗi cung ứng', 'admin', u.id, NULL, 1, DATE_SUB(NOW(), INTERVAL 32 DAY), 367
FROM users u WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin' LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT 'green-jobs-va-esg-trong-tuyen-dung',
  'Green jobs & ESG: Khi nhà tuyển dụng hỏi về bền vững ở phỏng vấn',
  'Báo cáo phát thải, năng lượng tái tạo và trách nhiệm xã hội doanh nghiệp — góc nhìn ứng viên.',
  '<p>Nhiều tập đoàn đặt mục tiêu carbon neutrality; điều này tạo việc làm cho kỹ sư năng lượng, chuyên gia môi trường và các vai trò liên quan báo cáo ESG.</p><h2>Ứng viên không thuộc ngành “xanh”</h2><p>Bạn vẫn có thể thể hiện hiểu biết: tiết kiệm năng lượng trong văn phòng, đa dạng nhà cung cấp, hoặc minh bạch dữ liệu.</p><div class="article-callout"><p><strong>Câu hỏi mẫu</strong></p><p>Bạn đã đề xuất cải tiến nào giảm lãng phí hoặc rủi ro môi trường trong công việc trước đây?</p></div>',
  'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=1200',
  'Bền vững & ESG', 'admin', u.id, NULL, 1, DATE_SUB(NOW(), INTERVAL 34 DAY), 340
FROM users u WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin' LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT 'ux-writer-va-content-design-trong-san-pham-so',
  'UX Writer & Content Design: Ngôn từ trong sản phẩm số',
  'Microcopy, tone of voice và khả năng phối hợp với product designer.',
  '<p>Người dùng đọc giao diện ứng dụng như đọc một cuộc hội thoại — mỗi nhãn nút và thông báo lỗi đều ảnh hưởng trải nghiệm.</p><h2>Công việc hằng ngày</h2><p>UX writer làm việc với design system, thử nghiệm A/B trên copy và đảm bảo tính nhất quán đa ngôn ngữ.</p><h2>Portfolio</h2><p>Trước/sau cho một flow phức tạp (checkout, onboarding) thể hiện rõ vấn đề nghiệp vụ và metric cải thiện.</p>',
  'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&q=80&w=1200',
  'Thiết kế & Sáng tạo', 'admin', u.id, NULL, 1, DATE_SUB(NOW(), INTERVAL 36 DAY), 315
FROM users u WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin' LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT 'hr-business-partner-la-gi-khi-nao-can',
  'HR Business Partner là gì — và khi nào doanh nghiệp cần?',
  'Đối tác chiến lược của quản lý dây chuyền: từ headcount đến văn hóa.',
  '<p>HRBP không chỉ làm tuyển dụng hay C&amp;B; họ đồng hành với quản lý kinh doanh để giải quyết năng suất, giữ chân nhân tài và thay đổi tổ chức.</p><h2>Kỹ năng</h2><p>Hiểu chỉ số kinh doanh cơ bản, facilitation workshop, và xử lý tình huống nhạy cảm một cách có quy trình.</p><h2>Lộ trình</h2><p>Nhiều HRBP bắt đầu từ chuyên viên C&amp;B hoặc T&amp;D, sau đó mở rộng vai trò tư vấn nội bộ.</p>',
  'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=1200',
  'Nhân sự & Phát triển tổ chức', 'admin', u.id, NULL, 1, DATE_SUB(NOW(), INTERVAL 38 DAY), 298
FROM users u WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin' LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT 'thuong-luong-luong-va-phuc-loi-goi-dau-tien',
  'Thương lượng lương và phúc lợi: Chuẩn bị cho buổi đàm phán đầu tiên',
  'Nghiên cứu thị trường, điểm neo và cách nói về bonus/stock một cách rõ ràng.',
  '<p>Mức đề nghị nên dựa trên dữ liệu thị trường và giá trị bạn mang lại, không chỉ nhu cầu cá nhân.</p><h2>Chuẩn bị</h2><p>Thu thập mức lương cho vai trò tương đương (khung thành phố, quy mô công ty), liệt kê thành tích đo lường được.</p><h2>Phúc lợi phi tiền</h2><p>Làm việc linh hoạt, học phí, bảo hiểm sức khỏe gia đình — đôi khi quy đổi được giá trị tương đương tiền mặt.</p><div class="article-callout"><p><strong>Lưu ý</strong></p><p>Giữ giọng điệu hợp tác: bạn đang tìm “gói tổng” phù hợp hai bên, không phải đối đầu.</p></div>',
  'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=1200',
  'Career Tips', 'admin', u.id, NULL, 1, DATE_SUB(NOW(), INTERVAL 40 DAY), 712
FROM users u WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin' LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT 'freelance-va-bao-hiem-xa-hoi-tu-nguyen',
  'Freelancer và BHXH tự nguyện: Những điều nên làm sớm',
  'Quyền lợi hưu trí, thất nghiệp (nếu áp dụng) và cách lập ngân sách khi thu nhập không đều.',
  '<p>Làm tự do mang lại linh hoạt nhưng cần chủ động quản lý rủi ro tài chính dài hạn.</p><h2>Thực hành</h2><p>Tách tài khoản thuế và quỹ dự phòng 3–6 tháng; định kỳ đánh giá mức đóng BHXH tự nguyện phù hợp khả năng.</p><h2>Hợp đồng</h2><p>Ghi rõ phạm vi công việc, milestone và thanh toán để tránh tranh chấp — đây cũng là tín hiệu chuyên nghiệp với khách hàng.</p>',
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=1200',
  'Pháp lý & Quyền lợi', 'admin', u.id, NULL, 1, DATE_SUB(NOW(), INTERVAL 42 DAY), 445
FROM users u WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin' LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT 'chuyen-nganh-sau-30-tuoi-cau-chuyen-that',
  'Chuyển ngành sau 30: Câu chuyện thật và cách giảm rủi ro',
  'Tái sử dụng kỹ năng chuyển giao, học có chứng chỉ và networking có chủ đích.',
  '<p>Chuyển hướng sự nghiệp muộn hơn không còn là ngoại lệ; điều quan trọng là cách kể câu chuyện nghề nghiệp nhất quán.</p><h2>Phân tích kỹ năng chuyển giao</h2><p>Quản lý dự án, giao tiếp khách hàng, phân tích số liệu — nhiều kỹ năng dùng được ở ngành mới dưới tên gọi khác.</p><h2>Thời gian</h2><p>Lộ trình 12–18 tháng với học phần, dự án cá nhân và cộng tác việc nhỏ giúp giảm nhảy cóc quá sớm.</p>',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1200',
  'Career Tips', 'admin', u.id, NULL, 1, DATE_SUB(NOW(), INTERVAL 44 DAY), 589
FROM users u WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin' LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT 'phu-nu-trong-stem-ra-soat-dinh-ki',
  'Phụ nữ trong STEM: Văn hóa cố vấn và “sponsor” thật sự',
  'Khác biệt giữa người cho lời khuyên và người mở cánh cửa cơ hội trong tổ chức.',
  '<p>Tỷ lệ nữ trong một số ngành kỹ thuật đang tăng dần; tuy nhiên điểm nghẽn thường nằm ở thăng tiến giữa và cao cấp.</p><h2>Mentor vs sponsor</h2><p>Mentor giúp phản tư nghề nghiệp; sponsor chủ động nhắc tên bạn trong phòng quyết định. Cả hai đều có giá trị.</p><h2>Doanh nghiệp</h2><p>Chính sách minh bạch về nghỉ thai sản, linh hoạt giờ và chống quấy rối là nền tảng để giữ nhân tài nữ.</p>',
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=1200',
  'Diversity & Văn hóa tổ chức', 'admin', u.id, NULL, 1, DATE_SUB(NOW(), INTERVAL 46 DAY), 356
FROM users u WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin' LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT 'suc-khoe-tinh-than-noi-lam-viec-khong-stigma',
  'Sức khỏe tinh thần nơi làm việc: Giảm kỳ thị và tăng hỗ trợ thực chất',
  'EAP, nghỉ phép và văn hóa phản hồi — góc nhìn nhân sự và người lao động.',
  '<p>Nhận thức về rối loạn lo âu và trầm cảm tại nơi làm việc đang tăng; điều quan trọng là chuyển từ khẩu hiệu sang quy trình hỗ trợ bảo mật.</p><h2>Doanh nghiệp</h2><p>Chương trình EAP, đào tạo quản lý nhận biết dấu hiệu sớm và tránh “thần hóa” làm việc cường độ cao.</p><h2>Người lao động</h2><p>Tìm kiếm giúp đỡ chuyên môn là dấu hiệu trách nhiệm, không phải yếu đuối — nhiều nơi có kênh nội bộ hoặc hotline.</p>',
  'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=1200',
  'Work Culture', 'admin', u.id, NULL, 1, DATE_SUB(NOW(), INTERVAL 48 DAY), 478
FROM users u WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin' LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT 'du-hoc-ve-nuoc-va-dinh-vi-nghe-nghiep',
  'Du học về nước: Định vị nghề nghiệp khi thị trường đã đổi khác',
  'Kỳ vọng lương, mạng lưới quan hệ trong nước và cách giải thích kinh nghiệm nước ngoài cho nhà tuyển dụng Việt Nam.',
  '<p>Kinh nghiệm quốc tế là lợi thế khi được dịch sang bối cảnh doanh nghiệp địa phương: quy định, văn hóa khách hàng và nhịp độ làm việc.</p><h2>Networking</h2><p>Tham gia cộng đồng nghề, hội cựu du học sinh và dự án tình nguyện giúp tái xây dựng quan hệ sau thời gian xa.</p><h2>Kỳ vọng</h2><p>Cân chỉnh kỳ vọng lương theo ngành và thành phố; chú trọng vào vai trò có thể chứng minh impact trong 90 ngày đầu.</p>',
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=1200',
  'Career Tips', 'admin', u.id, NULL, 1, DATE_SUB(NOW(), INTERVAL 50 DAY), 402
FROM users u WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin' LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT 'startup-vs-tap-doan-lua-chon-su-nghiep',
  'Startup vs tập đoàn: Hai đường ray sự nghiệp — ưu/nhược khi chọn',
  'Phạm vi trách nhiệm, tốc độ học và rủi ro tài chính khi đổi môi trường.',
  '<p>Không có đáp án đúng cho mọi người: giai đoạn đời khác nhau phù hợp mức độ hỗn loạn và cơ cấu khác nhau.</p><h2>Startup</h2><p>Đa nhiệm, học nhanh, equity tiềm năng — nhưng biến động cao.</p><h2>Tập đoàn</h2><p>Quy trình rõ, đào tạo bài bản, lương ổn định — có thể chậm thăng tiến nếu không chủ động tìm dự án nổi bật.</p>',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200',
  'Market Insights', 'admin', u.id, NULL, 1, DATE_SUB(NOW(), INTERVAL 52 DAY), 523
FROM users u WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin' LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT 'da-ngon-ngu-trong-moi-truong-fdi',
  'Đa ngôn ngữ trong môi trường FDI: Không chỉ là “nói được tiếng Anh”',
  'Giao tiếp đa văn hóa, họp xuyên múi giờ và viết email ngắn gọn có cấu trúc.',
  '<p>Doanh nghiệp có vốn đầu tư nước ngoài thường dùng tiếng Anh làm ngôn ngữ chung, nhưng hiểu văn hóa địa phương vẫn quyết định hiệu quả triển khai.</p><h2>Kỹ năng</h2><p>Tóm tắt quyết định, ghi chú hành động sau họp, và chủ động làm rõ giả định khi yêu cầu không đủ rõ.</p><h2>Phát triển</h2><p>Luyện thuyết trình ngắn (elevator pitch) về dự án của bạn bằng hai ngôn ngữ giúp tăng tự tin phỏng vấn nội bộ lẫn bên ngoài.</p>',
  'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=1200',
  'Kỹ năng mềm & Giao tiếp', 'admin', u.id, NULL, 1, DATE_SUB(NOW(), INTERVAL 54 DAY), 381
FROM users u WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin' LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT 'nong-nghiep-cong-nghe-cao-va-nhan-luc-dia-phuong',
  'Nông nghiệp công nghệ cao: Cơ hội việc làm bên cạnh cánh đồng thông minh',
  'Cảm biến, dữ liệu thời tiết và logistics nông sản — vai trò kỹ sư và vận hành.',
  '<p>Chuỗi giá trị nông sản khép kín cần người hiểu cả sinh học lẫn vận hành hệ thống.</p><h2>Vị trí</h2><p>Kỹ sư triển khai nhà kính tự động, phân tích đất và nước, điều phối thu hoạch theo hợp đồng xuất khẩu.</p><h2>Địa phương</h2><p>Nhiều dự án tạo việc làm tại tỉnh — cơ hội cho người muốn về gần gia đình nhưng vẫn làm công nghệ.</p>',
  'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&q=80&w=1200',
  'Ngành & Nghề', 'admin', u.id, NULL, 1, DATE_SUB(NOW(), INTERVAL 56 DAY), 267
FROM users u WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin' LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT 'legal-tech-va-nghe-luat-su-doanh-nghiep',
  'Legal tech và nghề luật sư doanh nghiệp: Hợp đồng, tuân thủ và tự động hóa',
  'Công cụ soạn hợp đồng, workflow phê duyệt và bảo vệ dữ liệu khách hàng.',
  '<p>Pháp lý doanh nghiệp ngày càng gắn với hệ thống: từ ký số đến lưu trữ chứng từ điện tử.</p><h2>Xu hướng</h2><p>Chuyên viên pháp chế cần quen thuộc với quy trình số, không chỉ soạn văn bản tĩnh.</p><h2>Hợp tác</h2><p>Làm việc với IT và bảo mật để đánh giá rủi ro khi triển khai sản phẩm mới hoặc thu thập dữ liệu cá nhân.</p>',
  'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=1200',
  'Pháp lý & Quyền lợi', 'admin', u.id, NULL, 1, DATE_SUB(NOW(), INTERVAL 58 DAY), 294
FROM users u WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin' LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT 'quan-tri-du-lieu-va-nganh-ban-le',
  'Quản trị dữ liệu trong bán lẻ: Từ POS đến cá nhân hóa khuyến mãi',
  'CDP, bảo vệ quyền riêng tư khách hàng và phân tích hành vi mua.',
  '<p>Bán lẻ đa kênh tạo lượng dữ liệu lớn; thách thức là làm cho dữ liệu “tin được” và dùng được trong thời gian thực.</p><h2>Vai trò</h2><p>Chuyên viên analytics, quản trị CDP và các vị trí liên quan bảo mật dữ liệu phải phối hợp chặt với marketing và IT.</p><h2>Đạo đức</h2><p>Minh bạch khi thu thập cookie và ưu tiên opt-in giúp giảm rủi ro uy tín thương hiệu.</p>',
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=1200',
  'Technology', 'admin', u.id, NULL, 1, DATE_SUB(NOW(), INTERVAL 60 DAY), 412
FROM users u WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin' LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT 'san-xuat-che-tao-40-va-tu-dong-hoa',
  'Sản xuất chế tạo 4.0: Tự động hóa, an toàn lao động và đào tạo lại',
  'Robot đồng hành, không thay thế hoàn toàn — vai trò kỹ thuật viên bảo trì.',
  '<p>Nhà máy hiện đại kết hợp IoT và bảo trì dự đoán để giảm downtime.</p><h2>Nhân lực</h2><p>Kỹ thuật viên điện — cơ, an toàn hóa chất và quản lý chất lượng vẫn là những vị trí cốt lõi.</p><h2>An toàn</h2><p>Đào tạo lại định kỳ và văn hóa báo cáo sự cố không trừng phạt giúp giảm tai nạn nghiêm trọng.</p>',
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1200',
  'Ngành & Nghề', 'admin', u.id, NULL, 1, DATE_SUB(NOW(), INTERVAL 62 DAY), 238
FROM users u WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin' LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT 'bds-va-tu-van-dau-tu-can-nhung-ai',
  'Bất động sản & tư vấn đầu tư: Kỹ năng phân tích và đạo đức nghề nghiệp',
  'Hiểu chu kỳ thị trường, pháp lý phân lô và trách nhiệm với khách hàng.',
  '<p>Môi giới và tư vấn đầu tư cần nền tảng pháp lý vững và khả năng giải thích rủi ro bằng ngôn ngữ dễ hiểu.</p><h2>Dữ liệu</h2><p>So sánh giá theo khu vực, quy hoạch và tiện ích — tránh cam kết lợi nhuận không có cơ sở.</p><div class="article-callout"><p><strong>Đạo đức</strong></p><p>Ưu tiên lợi ích khách hàng phù hợp pháp luật giúp xây dựng uy tín dài hạn hơn giao dịch một lần.</p></div>',
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1200',
  'Tài chính & Ngân hàng', 'admin', u.id, NULL, 1, DATE_SUB(NOW(), INTERVAL 64 DAY), 329
FROM users u WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin' LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT 'bao-chi-va-truyen-thong-noi-bo-trong-khung-hoang',
  'Báo chí & truyền thông nội bộ khi khủng hoảng: Thông điệp, tốc độ và sự nhất quán',
  'Khủng hoảng truyền thông không chỉ là “PR dập lửa” — cần quy trình và empathy.',
  '<p>Khi sự cố xảy ra, nhân viên và khách hàng đều cần thông tin đúng, kịp thời và thống nhất.</p><h2>Quy trình</h2><p>Phòng ban pháp chế, HR và truyền thông phối hợp theo kịch bản; tránh phát ngôn mâu thuẫn giữa các kênh.</p><h2>Nội bộ trước</h2><p>Nhân viên hiểu bối cảnh sẽ là đại sứ thương hiệu tốt hơn so với việc họ nghe tin tức từ bên ngoài trước.</p>',
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1200',
  'Marketing & Truyền thông', 'admin', u.id, NULL, 1, DATE_SUB(NOW(), INTERVAL 66 DAY), 276
FROM users u WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin' LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT 'khach-san-du-lich-hoi-phuc-va-thieu-hut-nhan-su',
  'Khách sạn & du lịch hồi phục: Thiếu hụt nhân sự có kinh nghiệm — giải pháp nào?',
  'Đào tạo nội bộ, cải thiện điều kiện ca đêm và lộ trình thăng tiến rõ ràng.',
  '<p>Nhiều điểm đến ghi nhận lượng khách tăng nhưng tuyển được nhân sự ổn định vẫn khó.</p><h2>Giải pháp</h2><p>Tăng cường đào tạo chéo giữa bộ phận, công nhận kỹ năng đa nhiệm và cải thiện lịch ca để giảm kiệt sức.</p><h2>Cơ hội</h2><p>Người mới vào ngành có thể bắt đầu từ lễ tân hoặc F&amp;B với lộ trình lên giám sát nếu chủ động học ngoại ngữ và dịch vụ.</p>',
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1200',
  'Dịch vụ & Du lịch', 'admin', u.id, NULL, 1, DATE_SUB(NOW(), INTERVAL 68 DAY), 351
FROM users u WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin' LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT 'chan-dung-giao-vien-tieng-anh-doanh-nghiep',
  'Chân dung giảng viên tiếng Anh doanh nghiệp: Từ “dạy ngữ pháp” đến giao tiếp họp hành',
  'ESP, coaching phát âm và thiết kế bài học theo ngành (y tế, kỹ thuật, bán hàng).',
  '<p>Doanh nghiệp cần tiếng Anh cho mục tiêu cụ thể: thuyết trình, đàm phán hoặc viết email chuyên ngành.</p><h2>Phương pháp</h2><p>Needs analysis trước khóa, học liệu lấy từ tài liệu thật (đã ẩn danh) và phản hồi 360 sau buổi role-play.</p><h2>Nghề nghiệp</h2><p>Giảng viên có thể kết hợp làm corporate trainer toàn thời hoặc freelance theo dự án.</p>',
  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=1200',
  'Giáo dục & Đào tạo', 'admin', u.id, NULL, 1, DATE_SUB(NOW(), INTERVAL 70 DAY), 298
FROM users u WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin' LIMIT 1;
