-- Seed 09: Tạp chí bổ sung — thêm ngành, chủ đề xã hội & nghề nghiệp (slug mới)
-- Chạy sau 07, 08. Admin: admin@hireai.vn

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT 'an-ninh-mang-va-soc-viec-lam-2026',
  'An ninh mạng & SOC: Lộ trình việc làm và chứng chỉ thường gặp năm 2026',
  'Từ analyst đến incident response — kỹ năng log, SIEM và giao tiếp với lãnh đạo.',
  '<p class="lead">Tấn công mạng gia tăng khiến nhu cầu nhân sự bảo mật không chỉ ở ngân hàng mà cả sản xuất, bán lẻ và y tế.</p><h2>Vai trí</h2><p>Chuyên viên giám sát SOC, phân tích mối đe dọa (threat intel) và kỹ sư triển khai IAM đều cần tư duy hệ thống và tài liệu hóa quy trình.</p><h2>Chứng chỉ</h2><p>Các chứng chỉ phổ biến giúp thống nhất ngôn ngữ với nhà tuyển dụng; song kinh nghiệm lab và báo cáo sự cố thực tế vẫn là điểm cộng lớn nhất.</p><div class="article-callout"><p><strong>Gợi ý</strong></p><p>Portfolio mô tả một lần phát hiện và xử lý sự cố (đã ẩn danh) thường thuyết phục hơn danh sách khóa học.</p></div>',
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1200',
  'Technology', 'admin', u.id, NULL, 1, DATE_SUB(NOW(), INTERVAL 3 DAY), 198
FROM users u WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin' LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT 'game-industry-viet-nam-art-code-va-liveops',
  'Ngành game Việt Nam: Art, code và live-ops — con đường vào studio',
  'Pipeline asset, engine, vận hành sự kiện trong game và văn hóa crunch.',
  '<p>Thị trường game mobile và PC/console xuất khẩu mở rộng; studio cần cả nghệ sĩ 2D/3D, lập trình gameplay và đội vận hành nội dung.</p><h2>Portfolio</h2><p>Demo có thể chơi được, reel animation ngắn hoặc mod map hoàn chỉnh thể hiện quy trình làm việc nhóm tốt hơn screenshot lẻ.</p><h2>Sức khỏe nghề nghiệp</h2><p>Deadline sát có thể dẫn tới làm thêm giờ; ứng viên nên hỏi rõ quy trình ước lượng effort và hỗ trợ nội bộ.</p>',
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=1200',
  'Ngành & Nghề', 'admin', u.id, NULL, 1, DATE_SUB(NOW(), INTERVAL 5 DAY), 287
FROM users u WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin' LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT 'bao-chi-ky-nghe-so-va-dao-duc-nghe-nghiep',
  'Báo chí kỹ thể số: Fact-check, đạo đức nghề nghiệp và áp lực lượt xem',
  'Làm tin đa nền tảng, tránh clickbait có hại và bảo vệ nguồn.',
  '<p>Phóng viên và biên tập viên làm việc với CMS, mạng xã hội và dữ liệu độc giả — tốc độ không được đánh đổi độ chính xác.</p><h2>Kỹ năng</h2><p>Đặt câu hỏi phản biện, đối chiếu nhiều nguồn độc lập và minh bạch khi sửa sai.</p><h2>Nghề nghiệp</h2><p>Freelance và hợp đồng ngắn hạn phổ biến; cần quản lý thu nhập và bản quyền hình ảnh rõ ràng.</p>',
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1200',
  'Marketing & Truyền thông', 'admin', u.id, NULL, 1, DATE_SUB(NOW(), INTERVAL 7 DAY), 312
FROM users u WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin' LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT 'phi-loi-nhuan-va-to-chuc-xa-hoi-dan-su',
  'Làm việc trong phi lợi nhuận & tổ chức xã hội dân sự: Huy động nguồn lực và đo lường tác động',
  'Grant writing, báo cáo donor và an toàn cho đội hiện trường.',
  '<p>Không gian phi lợi nhuận cần người vừa có sứ mệnh vừa có kỷ luật quản trị tài chính và minh bạch.</p><h2>Vai trí</h2><p>Điều phối dự án cộng đồng, chuyên viên phát triển quan hệ đối tác và truyền thông gây quỹ.</p><h2>Tác động</h2><p>Chỉ số outcome (học sinh được hỗ trợ, hộ gia đình thoát nghèo) quan trọng hơn chỉ số hoạt động (số buổi tập huấn) khi báo cáo cho nhà tài trợ.</p>',
  'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&q=80&w=1200',
  'Work Culture', 'admin', u.id, NULL, 1, DATE_SUB(NOW(), INTERVAL 9 DAY), 176
FROM users u WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin' LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT 'kien-truc-xay-dung-va-bim-thuc-hanh',
  'Kiến trúc & xây dựng: BIM, hiện trường và phối hợp đa nhà thầu',
  'Mô hình 3D dùng chung, an toàn lao động và tiến độ thi công.',
  '<p>Dự án hạ tầng và nhà cao tầng phụ thuộc phối hợp giữa chủ đầu tư, tư vấn thiết kế và nhà thầu.</p><h2>BIM</h2><p>Giảm xung đột bản vẽ và hỗ trợ khối lượng — kỹ năng Revit/ArchiCAD và quy trình CDE được tìm kiếm.</p><h2>An toàn</h2><p>Quy trình buộc dây an toàn, họp hiện trường ngắn và báo cáo sự cố kịp thời là văn hóa bắt buộc tại công trường lớn.</p>',
  'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=1200',
  'Ngành & Nghề', 'admin', u.id, NULL, 1, DATE_SUB(NOW(), INTERVAL 11 DAY), 221
FROM users u WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin' LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT 'nang-luong-chuyen-doi-va-ky-su-dien-gio',
  'Năng lượng chuyển đổi: Điện gió, lưới điện thông minh và nghề kỹ sư điện',
  'Tích hợp nguồn tái tạo, lưu trữ và quy hoạch bảo trì.',
  '<p>Việt Nam tăng công suất nguồn tái tạo; hệ thống cần kỹ sư hiểu cả thiết bị lẫn vận hành an toàn lưới.</p><h2>Cơ hội</h2><p>Thiết kế trạm biến áp, giám sát hiệu suất turbine và phân tích dữ liệu SCADA.</p><h2>Môi trường làm việc</h2><p>Công trường xa trung tâm — cần sẵn sàng di chuyển và làm việc theo ca.</p>',
  'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=1200',
  'Bền vững & ESG', 'admin', u.id, NULL, 1, DATE_SUB(NOW(), INTERVAL 13 DAY), 254
FROM users u WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin' LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT 'o-to-dien-va-chuoi-cung-ung-pin',
  'Ô tô điện & chuỗi cung ứng pin: Kỹ thuật, logistics và tuân thủ',
  'Bảo hành ắc quy, tái chế và đào tạo kỹ thuật viên đại lý.',
  '<p>Chuyển đổi sang xe điện tạo việc làm tại lắp ráp, phụ tùng và dịch vụ hậu mãi.</p><h2>Kỹ năng</h2><p>Điện tử ô tô, phần mềm ADAS và quản lý chất lượng chuỗi cung ứng linh kiện.</p><h2>An toàn</h2><p>Xử lý pin hỏng cần quy trình và đào tạo PPE phù hợp — thường là phần phỏng vấn kỹ thuật.</p>',
  'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&q=80&w=1200',
  'Logistics & Chuỗi cung ứng', 'admin', u.id, NULL, 1, DATE_SUB(NOW(), INTERVAL 15 DAY), 189
FROM users u WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin' LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT 'hang-khong-dich-vu-dat-va-an-ninh-hang-khong',
  'Hàng không dân dụng: Dịch vụ đất, an ninh hàng không và phục hồi sau đại dịch',
  'Đào tạo lại, lịch ca và stress trong môi trường dịch vụ cao.',
  '<p>Ngành hàng không cần nhân sự mặt đất và cabin với tiêu chuẩn an toàn nghiêm ngặt.</p><h2>Vị trí</h2><p>Điều phối cửa, xử lý hành lý, dịch vụ khách VIP và các vai trò logistics sân bay.</p><h2>Đào tạo</h2><p>Chương trình đào tạo nội bộ và chứng chỉ an ninh hàng không là bước vào nghề phổ biến.</p><h2>Sức khỏe</h2><p>Lịch làm đêm và múi giờ — doanh nghiệp tốt có chính sách nghỉ bù và hỗ trợ sức khỏe tinh thần.</p>',
  'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=1200',
  'Dịch vụ & Du lịch', 'admin', u.id, NULL, 1, DATE_SUB(NOW(), INTERVAL 17 DAY), 336
FROM users u WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin' LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT 'van-dong-vien-chuyen-nghiep-va-nghe-sau-su-nghiep',
  'Vận động viên chuyên nghiệp: Chuyển nghề sau sự nghiệp thi đấu',
  'Quản lý thương hiệu cá nhân, huấn luyện và học thêm bằng cấp.',
  '<p>Tuổi nghề ngắn khiến kế hoạch sau sự nghiệp cần sớm — dù ở bộ môn đồng đội hay cá nhân.</p><h2>Hướng đi</h2><p>Huấn luyện, truyền thông thể thao, đại lý tài năng và kinh doanh phòng gym hoặc thương hiệu thời trang.</p><h2>Học tập</h2><p>Bổ sung nghiệp vụ quản trị, marketing hoặc vật lý trị liệu giúp mở cửa việc làm bền vững hơn.</p>',
  'https://images.unsplash.com/photo-1461896836934-9fe05c0da887?auto=format&fit=crop&q=80&w=1200',
  'Career Tips', 'admin', u.id, NULL, 1, DATE_SUB(NOW(), INTERVAL 19 DAY), 412
FROM users u WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin' LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT 'nghe-sang-tao-thiet-ke-thoi-trang-va-ban-quyen',
  'Nghề sáng tạo: Thiết kế thời trang, bản quyền và hợp đồng với nhãn hàng',
  'Mẫu thử, sản xuất gia công và bảo vệ ý tưởng trước sao chép.',
  '<p>Thị trường thời trang nội địa và xuất khẩu cần designer vừa có gu vừa hiểu chi phí nguyên liệu.</p><h2>Hợp đồng</h2><p>Quyền sử dụng sketch, thù lao theo milestone và trách nhiệm khi chậm giao hàng gia công.</p><h2>Số hóa</h2><p>Thiết kế 3D, showroom ảo và bán hàng livestream — kỹ năng đa kênh ngày càng quan trọng.</p>',
  'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=1200',
  'Ngành & Nghề', 'admin', u.id, NULL, 1, DATE_SUB(NOW(), INTERVAL 21 DAY), 243
FROM users u WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin' LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT 'blockchain-doanh-nghiep-va-hop-dong-thong-minh',
  'Blockchain trong doanh nghiệp: Hợp đồng thông minh, kiểm toán và kỳ vọng thực tế',
  'Không phải mọi bài toán đều cần sổ cái phân tán — đánh giá ROI và rủi ro pháp lý.',
  '<p>Công nghệ sổ cái có ứng dụng truy xuất nguồn gốc, chứng thư điện tử và thanh toán xuyên biên giới — nhưng triển khai cần đội ngũ hiểu cả IT lẫn quy trình nghiệp vụ.</p><h2>Vai trò</h2><p>Developer smart contract, chuyên viên tuân thủ và kiểm toán nội bộ quy trình on-chain.</p><h2>Cảnh báo</h2><p>Biến động tài sản mã hóa và khung pháp lý đang đổi — ứng viên nên theo dõi cập nhật từ cơ quan quản lý.</p>',
  'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=1200',
  'Technology', 'admin', u.id, NULL, 1, DATE_SUB(NOW(), INTERVAL 23 DAY), 268
FROM users u WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin' LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT 'mua-hang-va-dao-duc-nha-cung-ung',
  'Mua hàng doanh nghiệp: Đạo đức nhà cung ứng, đa dạng hóa và chống hối lộ',
  'RFQ minh bạch, đánh giá ESG đối tác và quản lý xung đột lợi ích.',
  '<p>Chuỗi cung ứng toàn cầu chịu áp lực chi phí và quy định — bộ phận mua hàng đóng vai trò cửa ngăn rủi ro đạo đức.</p><h2>Quy trình</h2><p>Phân tách người đề xuất và người phê duyệt, lưu vết hợp đồng và đàm phán dựa trên tiêu chí công khai.</p><h2>Đa dạng</h2><p>Hỗ trợ nhà cung ứng nhỏ và doanh nghiệp do phụ nữ làm chủ có thể tăng tính bền vững chuỗi.</p>',
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=1200',
  'Logistics & Chuỗi cung ứng', 'admin', u.id, NULL, 1, DATE_SUB(NOW(), INTERVAL 25 DAY), 197
FROM users u WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin' LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT 'product-manager-b2b-va-discovery',
  'Product Manager B2B: Discovery, roadmap và làm việc với sales',
  'Phỏng vấn khách hàng doanh nghiệp, ưu tiên backlog và chỉ số adoption.',
  '<p>Sản phẩm B2B thường có chu kỳ bán dài và nhiều bên liên quan — PM cần cân bằng yêu cầu từ sales, CS và kỹ thuật.</p><h2>Discovery</h2><p>Hiểu workflow thực tế qua quan sát và dữ liệu sử dụng, tránh chỉ nghe yêu cầu giải pháp.</p><h2>Metric</h2><p>Activation, retention và NPS theo phân khúc khách hàng tốt hơn chỉ đếm tính năng giao.</p>',
  'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1200',
  'Technology', 'admin', u.id, NULL, 1, DATE_SUB(NOW(), INTERVAL 27 DAY), 445
FROM users u WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin' LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT 'lam-viec-remote-va-van-hoa-async',
  'Làm việc remote & văn hóa bất đồng bộ: Tài liệu hóa, ranh giới và tin tưởng',
  'Giảm họp, tăng chất lượng ghi chép và tránh kiệt sức khi luôn online.',
  '<p>Đội phân tán cần chuẩn rõ kỳ vọng phản hồi và kênh ưu tiên — không phải mọi việc đều cần chat ngay lập tức.</p><h2>Thực hành</h2><p>Summary sau họp, quyết định ghi rõ owner và deadline; dùng video bất đồng bộ cho cập nhật dài.</p><h2>Ranh giới</h2><p>Thỏa thuận khung giờ chồng lấn và quyền tắt thông báo ngoài ca giúp giảm burnout.</p>',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200',
  'Work Culture', 'admin', u.id, NULL, 1, DATE_SUB(NOW(), INTERVAL 29 DAY), 389
FROM users u WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin' LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT 'luong-thuong-va-benchmark-theo-nganh',
  'Lương thưởng & benchmark: So sánh theo ngành, cấp bậc và vùng — hiểu đúng để đàm phán',
  'Total reward, phụ cấp và các khoản không tiền mặt trong gói đãi ngộ.',
  '<p>Đàm phán lương hiệu quả dựa trên dữ liệu thị trường và giá trị đóng góp có thể định lượng.</p><h2>Nguồn</h2><p>Báo cáo lương ngành, khảo sát peer và tham khảo JD tương đương — lưu ý khác biệt quy mô công ty.</p><h2>Toàn diện</h2><p>Bảo hiểm, học phí, cổ phần và thời gian linh hoạt đôi khi quan trọng như số tiền mặt.</p>',
  'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=1200',
  'Career Tips', 'admin', u.id, NULL, 1, DATE_SUB(NOW(), INTERVAL 31 DAY), 512
FROM users u WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin' LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT 'ban-hang-b2b-saas-va-chu-ky-mua',
  'Bán hàng B2B SaaS: Chu kỳ mua dài, champion nội bộ và proof of value',
  'Discovery call, pilot và mở rộng phạm vi — kỹ năng giao tiếp với IT và tài chính.',
  '<p>Bán phần mềm cho doanh nghiệp đòi hỏi hiểu pain đa phòng ban và khả năng chứng minh ROI.</p><h2>Quy trình</h2><p>Xác định người dùng cuối, người phê duyệt ngân sách và rào cản kỹ thuật (tích hợp, bảo mật).</p><h2>Sự nghiệp</h2><p>AE kết hợp kỹ năng storytelling số liệu; SDR/ BDR tập trung pipeline và đủ kiên nhẫn follow-up có cấu trúc.</p>',
  'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=1200',
  'Marketing & Truyền thông', 'admin', u.id, NULL, 1, DATE_SUB(NOW(), INTERVAL 33 DAY), 298
FROM users u WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin' LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT 'cong-chuc-va-thi-tuyen-digital-hoa',
  'Khu vực công & thi tuyển: Chuyển đổi số dịch vụ và kỹ năng hành chính hiện đại',
  'Quy trình một cửa, dữ liệu mở và yêu cầu kỹ năng phân tích cơ bản.',
  '<p>Nhiều địa phương số hóa thủ tục — cán bộ cần vừa am hiểu văn bản pháp lý vừa hỗ trợ người dân sử dụng kênh trực tuyến.</p><h2>Cơ hội</h2><p>Chuyên viên chính sách, phân tích dữ liệu xã hội và điều phối dự án smart city cấp cơ sở.</p><h2>Thi cử</h2><p>Ôn tập theo đề cương công khai; rèn kỹ năng viết luận ngắn và tình huống đạo đức công vụ.</p>',
  'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=1200',
  'Ngành & Nghề', 'admin', u.id, NULL, 1, DATE_SUB(NOW(), INTERVAL 35 DAY), 361
FROM users u WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin' LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT 'truyen-hinh-streaming-va-san-xuat-noi-dung',
  'Truyền hình & streaming: Sản xuất nội dung, bản quyền và thị trường quảng cáo',
  'Writer room, post-production và phân phối đa nền tảng.',
  '<p>Nền tảng xem theo yêu cầu cạnh tranh với truyền hình truyền thống — nhu cầu biên kịch, dựng phim và quản lý dự án sản xuất.</p><h2>Bản quyền</h2><p>Thương lượng territory, window phát hành và doanh thu chia sẻ — hiểu luật sở hữu trí tuệ cơ bản là lợi thế.</p><h2>Quảng cáo</h2><p>Ad-supported tier phát triển — cần người hiểu đo lường reach và brand safety.</p>',
  'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&q=80&w=1200',
  'Marketing & Truyền thông', 'admin', u.id, NULL, 1, DATE_SUB(NOW(), INTERVAL 37 DAY), 274
FROM users u WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin' LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT 'thuc-tap-sinh-va-chuong-trinh-visa-nghe-nghiep',
  'Thực tập sinh & chương trình visa nghề nghiệp: Quyền lợi, hợp đồng và kỳ vọng học hỏi',
  'Chọn đơn vị tiếp nhận uy tín, tránh bóc lột và xây dựng portfolio.',
  '<p>Chương trình trao đổi và thực tập quốc tế mở cửa trải nghiệm nhưng cần đọc kỹ điều khoản làm việc và hỗ trợ chỗ ở.</p><h2>Thực hành</h2><p>Mục tiêu học tập rõ ràng, mentor được gán và báo cáo định kỳ giúp hai bên đánh giá công bằng.</p><h2>Sau chương trình</h2><p>Chuyển kinh nghiệm sang CV theo kết quả đo được (dự án, chứng chỉ) thay vì chỉ tên chương trình.</p>',
  'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1200',
  'Career Tips', 'admin', u.id, NULL, 1, DATE_SUB(NOW(), INTERVAL 39 DAY), 228
FROM users u WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin' LIMIT 1;
