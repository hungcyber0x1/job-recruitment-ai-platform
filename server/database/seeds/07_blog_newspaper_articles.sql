-- Seed 07: Bài blog dạng tạp chí — nội dung dài (cần migration 035_blog_view_count.sql)
-- Chạy sau seed 03 (admin@hireai.vn)

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT
  'thi-truong-tuyen-dung-it-viet-nam-2026',
  'Thị trường tuyển dụng IT Việt Nam 2026: Những con số cần biết',
  'Cloud, bảo mật và AI tiếp tục dẫn dắt nhu cầu nhân lực. Phân tích dữ liệu công khai và khảo sát doanh nghiệp địa phương.',
  '<p class="lead">Sau hai năm điều chỉnh sau đại dịch, thị trường tuyển dụng công nghệ tại Việt Nam bước vào giai đoạn ổn định với cơ cấu rõ ràng: doanh nghiệp ưu tiên vai trò có thể đo lường ROI, trong khi ứng viên tìm kiếm sự linh hoạt và lộ trình thăng tiến minh bạch.</p><h2>Phân khúc đang nóng</h2><p>Backend (Go, Java, .NET), DevOps/SRE và kỹ sư dữ liệu vẫn nằm trong nhóm có tỷ lệ trống vị trí cao. Các công ty product và outsourcing lớn tại TP.HCM và Hà Nội duy trì tuyển liên tục; Đà Nẵng và các hub nhỏ tăng tốc nhờ chính sách làm việc hybrid.</p><h2>Mức đãi ngộ</h2><p>Mặc dù không còn “sốt” như giai đoạn 2021–2022, tổng thu nhập gói cho kỹ sư có kinh nghiệm 3–5 năm vẫn tăng nhẹ theo hệ số lạm phát. Phụ cấp remote, bảo hiểm sức khỏe và đào tạo nội bộ trở thành yếu tố cạnh tranh song song với tiền mặt.</p><div class="article-callout"><p><strong>Nhận định</strong></p><p>Ứng viên nên đầu tư vào portfolio có bài toán thực tế và khả năng đọc yêu cầu nghiệp vụ — điều mà nhiều nhà tuyển dụng đánh giá ngang bằng kỹ năng coding.</p></div><p>Chúng tôi sẽ cập nhật bản đồ lương chi tiết theo quý trên HireAI Insights.</p>',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200',
  'Market Insights',
  'admin',
  u.id,
  NULL,
  1,
  DATE_SUB(NOW(), INTERVAL 2 DAY),
  1840
FROM users u
WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin'
LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT
  'ky-nang-ai-khong-the-bo-qua-cho-developer',
  'Kỹ năng AI không thể bỏ qua nếu bạn là Developer',
  'Từ prompt có cấu trúc đến RAG và đánh giá hallucination — bức tranh tối thiểu để làm việc với LLM trong sản phẩm thật.',
  '<p>Trí tuệ nhân tạo không thay thế lập trình viên, nhưng lập trình viên biết tích hợp AI đang tạo ra lợi thế rõ rệt trong pipeline giao hàng phần mềm.</p><h2>Prompt và ngữ cảnh</h2><p>Viết prompt hiệu quả là kỹ năng có thể học: phân vai, đưa ví dụ few-shot, và giới hạn định dạng đầu ra. Điều quan trọng là hiểu giới hạn của mô hình và luôn có bước kiểm chứng.</p><h2>RAG và dữ liệu nội bộ</h2><p>Nhiều sản phẩm doanh nghiệp cần truy vấn tài liệu nội bộ. Kiến trúc vector store, chunking và metadata filtering là phần backend — nơi developer đóng vai trò trung tâm.</p><div class="article-callout"><p><strong>Mẹo thực chiến</strong></p><p>Đừng chỉ gọi API chat. Hãy thiết kế pipeline: ingest → nhúng → truy hồi → sinh câu trả lời → ghi log để cải tiến.</p></div><p>Chúng tôi khuyến khích bạn thử các bài lab ngắn trên HireAI để làm quen.</p>',
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1200',
  'Technology',
  'admin',
  u.id,
  NULL,
  1,
  DATE_SUB(NOW(), INTERVAL 4 DAY),
  1620
FROM users u
WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin'
LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT
  'cv-chuan-ats-checklist-day-du',
  'CV chuẩn ATS: Checklist đầy đủ trước khi nộp đơn',
  'Từ khóa, cấu trúc heading, định dạng file và những lỗi khiến hồ sơ bị loại ngay vòng máy.',
  '<p>Hệ thống ATS (Applicant Tracking System) không phải là “kẻ thù” — nó là bộ lọc đầu tiên giúp nhà tuyển dụng xử lý hàng trăm hồ sơ. Hiểu luật chơi sẽ giúp bạn không bị loại oan.</p><h2>Cấu trúc rõ ràng</h2><p>Dùng tiêu đề phụ chuẩn: Kinh nghiệm, Học vấn, Kỹ năng, Dự án. Tránh bảng phức tạp và hình ảnh chứa chữ quan trọng — nhiều engine OCR đọc kém.</p><h2>Từ khóa có chủ đích</h2><p>Đọc mô tả công việc, gạch chân kỹ năng lặp lại. Gắn từ khóa đó vào phần kinh nghiệm với ngữ cảnh cụ thể, không nhồi nhét.</p><div class="article-callout"><p><strong>Checklist 60 giây</strong></p><p>File PDF một cột · Font dễ đọc · Liên kết portfolio/LinkedIn hoạt động · Không lỗi chính tả tên công ty.</p></div><p>Trên HireAI, bạn có thể dùng công cụ gợi ý từ khóa theo JD để đối chiếu CV.</p>',
  'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=1200',
  'Career Tips',
  'admin',
  u.id,
  NULL,
  1,
  DATE_SUB(NOW(), INTERVAL 6 DAY),
  1410
FROM users u
WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin'
LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT
  'phong-van-hanh-vi-star-nang-cao',
  'Phỏng vấn hành vi: STAR không chỉ là viết — mà là kể có số liệu',
  'Cách biến từng ý trong STAR thành bằng chứng mà nhà tuyển dụng có thể tin.',
  '<p>Phương pháp STAR (Situation – Task – Action – Result) đã trở nên quen thuộc, nhưng ứng viên thường dừng ở mô tả chung chung. Người phỏng vấn muốn thấy độ tin cậy qua số liệu và vai trò cá nhân.</p><h2>Situation gọn nhưng đủ bối cảnh</h2><p>Giới hạn 2–3 câu: đội ngũ, thời điểm, áp lực kinh doanh. Không cần kể cả lịch sử dự án.</p><h2>Result phải đo được</h2><p>Giảm thời gian build 30%, tăng conversion 12%, hay giảm incident P1 — hãy chọn một chỉ số trung thực mà bạn có thể giải thích nếu bị drill-down.</p><div class="article-callout"><p><strong>Lỗi thường gặp</strong></p><p>Dùng “chúng tôi” cho toàn bộ câu chuyện mà không nói rõ bạn đã làm gì cụ thể.</p></div><p>Luyện tập với bạn bè: một người hỏi drill-down 3 lớp cho mỗi câu trả lời.</p>',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1200',
  'Interview',
  'admin',
  u.id,
  NULL,
  1,
  DATE_SUB(NOW(), INTERVAL 8 DAY),
  1195
FROM users u
WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin'
LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT
  'remote-hybrid-van-phong-gen-z-2026',
  'Remote, hybrid hay văn phòng: Gen Z đang chọn thế nào?',
  'Khảo sát nhanh về kỳ vọng linh hoạt, gắn kết đội nhóm và vai trò của lãnh đạo trẻ.',
  '<p>Tranh luận về mô hình làm việc không còn đơn thuần “sưởi ấm ghế văn phòng”. Gen Z quan tâm đến quyền được ngắt kết nối, họp có agenda và công cụ async hiệu quả.</p><h2>Hybrid có điều kiện</h2><p>Nhiều công ty chuyển sang 2–3 ngày tại văn phòng để duy trì văn hóa, nhưng yêu cầu rõ ràng: ngày lên văn phòng phải có ý nghĩa (workshop, onboarding, review).</p><h2>Remote thuần</h2><p>Phù hợp đội product đã trưởng thành và có quy trình ghi chép tốt. Rủi ro là cô lập và chậm thăng tiến nếu không có mentor chủ động.</p><div class="article-callout"><p><strong>Gợi ý cho nhà tuyển dụng</strong></p><p>Đưa chính sách linh hoạt vào JD một cách trung thực — ứng viên đánh giá cao minh bạch hơn slogan.</p></div>',
  'https://images.unsplash.com/photo-1593642532400-2682810df593?auto=format&fit=crop&q=80&w=1200',
  'Work Culture',
  'admin',
  u.id,
  NULL,
  1,
  DATE_SUB(NOW(), INTERVAL 10 DAY),
  980
FROM users u
WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin'
LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT
  'lo-trinh-ai-engineer-12-thang-dau',
  'Lộ trình AI Engineer: 12 tháng đầu nên học gì?',
  'Toán nền, Python, ML cổ điển, deep learning nhẹ và triển khai mô hình — thứ tự hợp lý để không bị quá tải.',
  '<p>Trở thành kỹ sư AI là hành trình dài, nhưng 12 tháng đầu có thể định hình nền tảng nếu bạn tránh dàn trải.</p><h2>Quý 1–2</h2><p>Ôn đại số tuyến tính và xác suất ở mức ứng dụng. Python, NumPy, Pandas. Một khóa ML cổ điển (hồi quy, phân loại, đánh giá mô hình).</p><h2>Quý 3–4</h2><p>Giới thiệu mạng neural, framework phổ biến, và một dự án nhỏ triển khai API inference (Docker, batch nhỏ).</p><div class="article-callout"><p><strong>Lưu ý</strong></p><p>Đừng nhảy thẳng vào mô hình khổng lồ nếu bạn chưa làm chủ pipeline dữ liệu và metric.</p></div><p>HireAI Career có bản đồ học tập cập nhật theo từng quý.</p>',
  'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=1200',
  'Education',
  'admin',
  u.id,
  NULL,
  1,
  DATE_SUB(NOW(), INTERVAL 12 DAY),
  870
FROM users u
WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin'
LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT
  'an-ninh-mang-nghe-nghiep-viet-nam',
  'An ninh mạng: Lộ trình nghề nghiệp và chứng chỉ được nhắc đến nhiều nhất',
  'Từ SOC analyst đến AppSec — nhu cầu tăng khi quy định dữ liệu và rủi ro ransomware được đặt lên bàn Giám đốc.',
  '<p>Tấn công mạng không còn là chuyện “IT lo”. Ban lãnh đạo yêu cầu báo cáo rủi ro định kỳ, và đội bảo mật cần người vừa hiểu kỹ thuật vừa diễn giải được bằng ngôn ngữ kinh doanh.</p><h2>Vai trò phổ biến</h2><p>Chuyên viên phân tích SOC, kỹ sư pentest, và vị trí kết hợp DevSecOps trong pipeline CI/CD.</p><h2>Chứng chỉ tham khảo</h2><p>Các chứng chỉ được nhắc trong JD thường là điểm cộng, nhưng kinh nghiệm thực chiến và write-up minh bạch vẫn là thứ được đánh giá cao trong phỏng vấn kỹ thuật.</p><div class="article-callout"><p><strong>Xu hướng</strong></p><p>Ứng dụng AI trong giám sát log và phát hiện bất thường — cần người hiểu cả ML lẫn an toàn thông tin.</p></div>',
  'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=1200',
  'Technology',
  'admin',
  u.id,
  NULL,
  1,
  DATE_SUB(NOW(), INTERVAL 14 DAY),
  760
FROM users u
WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin'
LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT
  'burnout-trong-nganh-cong-nghe-dau-hieu-som',
  'Burnout trong ngành công nghệ: Dấu hiệu sớm và cách phòng ngừa',
  'Khi “luôn online” trở thành chuẩn mực — làm sao để bảo vệ sức khỏe tinh thần mà không bỏ lỡ cơ hội?',
  '<p>Burnout không phải sự yếu đuối; đó là tín hiệu hệ thống quá tải. Trong ngành tech, nó thường đến từ deadline chồng chất, on-call căng thẳng và văn hóa “phản hồi tức thì”.</p><h2>Dấu hiệu</h2><p>Mất hứng thú với dự án từng yêu thích, cáu kỉnh với đồng nghiệp, hoặc trì hoãn công việc nhỏ nhất — kéo dài hơn hai tuần cần được xem xét nghiêm túc.</p><h2>Phòng ngừa</h2><p>Ranh giới rõ ràng với quản lý, ưu tiên ngủ đủ, và chia sẻ tải trong đội thay vì gánh một mình.</p><div class="article-callout"><p><strong>Với quản lý</strong></p><p>Khối lượng công việc bền vững quan trọng hơn sprint ngắn hạn tăng velocity.</p></div>',
  'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=1200',
  'Work Culture',
  'admin',
  u.id,
  NULL,
  1,
  DATE_SUB(NOW(), INTERVAL 16 DAY),
  640
FROM users u
WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin'
LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT
  'tu-duy-san-pham-cho-developer-muon-len-senior',
  'Tư duy sản phẩm cho Developer: Bước không thể thiếu để lên Senior',
  'Hiểu metric, thử nghiệm và đánh đổi kỹ thuật — khi code chỉ là một phần của bài toán.',
  '<p>Lên Senior không chỉ là viết code nhanh hơn. Đó là khi bạn đặt câu hỏi đúng về giá trị người dùng và rủi ro kinh doanh trước khi chọn kiến trúc.</p><h2>Câu hỏi nên làm quen</h2><p>Chúng ta đo thành công thế nào? Giả thuyết nào đang được kiểm chứng? Chi phí cơ hội của việc hoãn release là gì?</p><h2>Làm việc với PM/Design</h2><p>Lắng nghe constraint thật sự, đề xuất trade-off có số liệu thay vì chỉ nói “không làm được”.</p><div class="article-callout"><p><strong>Thực hành</strong></p><p>Tham gia review metric sau release và retro — dù bạn là IC, góc nhìn của bạn vẫn có giá trị.</p></div>',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200',
  'Career Tips',
  'admin',
  u.id,
  NULL,
  1,
  DATE_SUB(NOW(), INTERVAL 18 DAY),
  590
FROM users u
WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin'
LIMIT 1;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at, view_count)
SELECT
  'outsourcing-vs-product-team-ban-chon-duong-nao',
  'Outsourcing vs Product team: Hai môi trường, hai lộ trình sự nghiệp',
  'So sánh thẳng thắn về nhịp độ, độ sâu kỹ thuật và cơ hội thăng tiến — không có đáp án đúng cho mọi người.',
  '<p>Nhiều developer bắt đầu từ outsourcing để tiếp xúc đa dạng ngành; số khác vào product để đi sâu một bài toán dài hạn. Cả hai đều hợp lệ nếu khớp giai đoạn cuộc đời bạn.</p><h2>Outsourcing</h2><p>Dự án xoay vòng, học stack rộng, làm việc theo contract rõ ràng. Thích hợp nếu bạn muốn va chạm nhanh và xây network rộng.</p><h2>Product</h2><p>Vòng đời tính năng dài, trách nhiệm vận hành và metric gắn với OKR. Thích hợp nếu bạn muốn ownership sâu.</p><div class="article-callout"><p><strong>Câu hỏi tự hỏi</strong></p><p>Bạn ưu tiên độ sâu hay độ rộng trong 2–3 năm tới?</p></div>',
  'https://images.unsplash.com/photo-1521737711867-e3b973350f72?auto=format&fit=crop&q=80&w=1200',
  'Market Insights',
  'admin',
  u.id,
  NULL,
  1,
  DATE_SUB(NOW(), INTERVAL 20 DAY),
  520
FROM users u
WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin'
LIMIT 1;
