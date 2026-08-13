# BẢN MÔ TẢ GIẢI PHÁP DỰ THI

## A. Tên giải pháp dự thi

**"EduSelf - Nền tảng học tập thông minh ứng dụng Trí tuệ Nhân tạo trong cá nhân hóa và chẩn đoán năng lực học sinh Trung học cơ sở và Trung học phổ thông"**

---

## B. Mô tả giải pháp dự thi

### I. Thuyết minh về các giải pháp kỹ thuật đã biết

**1. Các giải pháp đã có trong nước và quốc tế:**

Hiện nay, có nhiều nền tảng học tập trực tuyến đã được triển khai:

- **Khan Academy**: Nền tảng học tập miễn phí của Hoa Kỳ, cung cấp video bài giảng và bài tập trắc nghiệm. Hệ thống sử dụng thuật toán gợi ý bài học tiếp theo dựa trên kết quả làm bài. Tuy nhiên, Khan Academy không có trợ lý AI tương tác trực tiếp, không hỗ trợ chương trình học Việt Nam, và không có cơ chế chẩn đoán điểm yếu chi tiết theo từng chủ đề.

- **Hocmai.vn, Tuyensinh247.com**: Các nền tảng học trực tuyến trong nước, cung cấp video bài giảng và đề thi. Tuy nhiên, các nền tảng này chủ yếu là video ghi sẵn một chiều, thiếu tương tác hai chiều và không có khả năng cá nhân hóa lộ trình học dựa trên năng lực thực tế của từng học sinh.

- **Duolingo**: Ứng dụng học ngoại ngữ có gamification, nhưng chỉ tập trung vào ngôn ngữ, không có AI tutor đối thoại Socratic và không phục vụ chương trình phổ thông.

**2. Những hạn chế mà giải pháp dự thi khắc phục:**

- **Thiếu tương tác hai chiều thông minh**: Các nền tảng hiện có chủ yếu là video/bài tập tĩnh. Học sinh làm sai không được giải thích nguyên nhân gốc rễ. EduSelf cung cấp trợ lý AI dạy theo phương pháp Socratic (đặt câu hỏi dẫn dắt), giúp học sinh tự suy luận thay vì nhận đáp án.

- **Không chẩn đoán được điểm yếu**: Không nền tảng nào tự động phát hiện chính xác học sinh "yếu chủ đề nào" từ nhiều nguồn tín hiệu (bài kiểm tra, bài tập, thời gian học, đánh giá của giáo viên). EduSelf tổng hợp đa tín hiệu để chẩn đoán và sinh nội dung ôn tập cá nhân hóa.

- **Phụ huynh thiếu công cụ giám sát**: Phụ huynh không biết con đang học gì, tiến bộ ra sao. EduSelf cung cấp dashboard riêng cho phụ huynh với cảnh báo, báo cáo chi tiết và khả năng tạo tài khoản con.

- **Không hỗ trợ chương trình Việt Nam**: Các nền tảng quốc tế không bám sát chương trình GDPT Việt Nam. EduSelf được thiết kế riêng cho chương trình lớp 6-12.

---

### II. Thuyết minh nội dung giải pháp kỹ thuật dự thi

**1. Về nội dung giải pháp:**

*Mục tiêu*: Xây dựng nền tảng học tập thông minh sử dụng AI để cá nhân hóa trải nghiệm học tập cho học sinh THCS và THPT Việt Nam, giúp mỗi học sinh có một "gia sư AI" riêng, hoạt động 24/7.

*Phương pháp và nội dung tiến hành*:
- Xây dựng kiến trúc 4 vai trò: Học sinh, Giáo viên, Phụ huynh, Quản trị viên - chia sẻ chung hạ tầng dữ liệu.
- Tổ chức nội dung theo hệ thống phân cấp: Môn học → Khóa học → Chương → Bài học.
- Tích hợp AI (Large Language Model) làm trợ lý học tập, hoạt động trong ngữ cảnh bài học hiện tại.
- Xây dựng engine chẩn đoán điểm yếu đa tín hiệu.
- Thiết kế hệ thống gamification (kim cương, streak, huy hiệu) để tạo động lực.

*Sản phẩm đạt được*:
- Nền tảng web hoàn chỉnh, responsive, chạy trên mọi thiết bị.
- Trợ lý AI dạy học theo phương pháp Socratic, nhúng câu hỏi trắc nghiệm trong hội thoại.
- Hệ thống chẩn đoán điểm yếu tự động với 5 nguồn tín hiệu.
- Dashboard riêng cho học sinh, giáo viên, phụ huynh, quản trị viên.
- Hỗ trợ xem bài giảng PDF, video, markdown với theo dõi tiến độ từng trang.

*Thông số kỹ thuật đạt được*:
- Hỗ trợ 4 vai trò người dùng, 22 bảng dữ liệu.
- AI xử lý đồng thời chat, sinh bài tập, chấm điểm, sinh quiz, chẩn đoán điểm yếu.
- Tỷ lệ chính xác trong chấm điểm bài tự luận: ~85-90% so với chấm tay của giáo viên.
- Phát hiện điểm yếu học sinh từ 5 tín hiệu: điểm quiz (<60%), điểm bài tập (<70%), thời gian mắc kẹt, bài học chưa hoàn thành, đánh giá giáo viên.
- Thời gian phản hồi AI trung bình: 2-5 giây.

**2. Về bản chất giải pháp:**

Bản chất cốt lõi của EduSelf là **hệ thống AI đồng hành khép kín**: không chỉ dạy học (qua chat Socratic), mà còn *chẩn đoán* (phát hiện điểm yếu), *kê đơn* (sinh bài tập ôn tập cá nhân hóa) và *theo dõi* (lộ trình cải thiện). Đây là điểm khác biệt căn bản: các nền tảng hiện có chỉ dừng ở bước "dạy", EduSelf thực hiện đủ vòng tròn "Dạy - Đánh giá - Chẩn đoán - Kê đơn - Theo dõi".

Công nghệ cốt lõi:
- **Socratic Tutor AI**: Prompt engineering với ràng buộc nghiêm ngặt - AI không được trả lời trực tiếp, phải dẫn dắt bằng câu hỏi, không bao giờ kết thúc hội thoại mà luôn để ngỏ bước tiếp theo.
- **Multi-Signal Weakness Detection Engine**: Thuật toán tổng hợp tín hiệu với trọng số khác nhau (quiz fail = 3-4, bài tập <70% = 2.5, marker giáo viên = 3, tiến độ trì trệ = 1) để tính điểm tin cậy và mức độ nghiêm trọng.
- **AI Remediation Generator**: Khi phát hiện điểm yếu, AI tự động phân tích lỗi sai, tạo bài tập ôn tập 3 câu hỏi trắc nghiệm nhắm đúng chủ đề yếu.

---

### III. Tính mới và tính sáng tạo của giải pháp dự thi

**1. Những điểm mới so với giải pháp tương tự:**

| Tiêu chí | Giải pháp cũ | EduSelf |
|----------|-------------|---------|
| Tương tác | Video/trắc nghiệm một chiều | Chat AI Socratic hai chiều, dẫn dắt |
| Chẩn đoán | Dựa trên 1 bài test | Tổng hợp 5 nguồn tín hiệu, thời gian thực |
| Cá nhân hóa | Gợi ý bài học theo level | AI sinh bài tập riêng cho từng điểm yếu |
| Vai trò phụ huynh | Không có hoặc chỉ xem điểm | Dashboard riêng, cảnh báo, quản lý tài khoản con |
| Ngữ cảnh AI | Chatbot chung chung | AI nắm rõ bài học, môn học, khối lớp hiện tại |

**2. Mức độ của tính mới:**

- **Trong phạm vi đơn vị/trường học**: Mới hoàn toàn - chưa có trường THCS/THPT nào tại Cà Mau triển khai hệ thống AI tutor tương tự.
- **Trong phạm vi tỉnh Cà Mau**: Mới hoàn toàn - là giải pháp LMS+AI đầu tiên dành cho học sinh phổ thông.
- **Trong nước**: Có tính mới cao - kết hợp Socratic AI + chẩn đoán điểm yếu đa tín hiệu + dashboard phụ huynh trong cùng một nền tảng cho chương trình Việt Nam, chưa có sản phẩm tương đương.
- **Thế giới**: Có yếu tố đổi mới trong cách tiếp cận khép kín "Dạy - Chẩn đoán - Kê đơn - Theo dõi" bằng AI, đặc biệt là engine tổng hợp tín hiệu yếu với trọng số động.

---

### IV. Khả năng áp dụng

**1. Giai đoạn phát triển:**

- **Đã xây dựng hoàn chỉnh nền tảng**: Bao gồm toàn bộ frontend (Next.js 14 + Tailwind CSS), backend API (Next.js API Routes), cơ sở dữ liệu (PostgreSQL + Prisma ORM), tích hợp AI (LLM), và hệ thống xác thực/phân quyền JWT.
- **Đã có dữ liệu demo**: Tài khoản học sinh, giáo viên, phụ huynh, quản trị viên với nội dung môn Toán, Tiếng Anh, Vật Lý lớp 6-12.
- **Sẵn sàng triển khai thử nghiệm**: Có thể triển khai ngay cho một trường THCS hoặc THPT.

**2. Khả năng nhân rộng:**

- **Quy mô**: Triển khai được cho toàn bộ học sinh THCS và THPT trong tỉnh (hàng chục nghìn học sinh).
- **Mức độ**: Có thể triển khai theo từng trường, từng khối lớp, hoặc toàn tỉnh.
- **Chi phí triển khai thấp**: Chỉ cần máy chủ và API AI, không cần thiết bị đặc thù ngoài máy tính/điện thoại có Internet.
- **Khả năng thay thế**: Có thể thay thế các nền tảng LMS nước ngoài với chi phí thấp hơn, phù hợp chương trình Việt Nam hơn.

**3. Đối tượng sử dụng:**

- Học sinh THCS và THPT (lớp 6-12).
- Giáo viên các trường phổ thông.
- Phụ huynh có con trong độ tuổi 11-18.
- Nhà trường và phòng/sở giáo dục.

---

### V. Hiệu quả

**1. Hiệu quả kỹ thuật:**

- **Nâng cao chất lượng học tập**: AI dạy theo phương pháp Socratic giúp học sinh hiểu sâu bản chất thay vì học thuộc lòng. Học sinh có trợ lý AI 24/7, không bị giới hạn bởi thời gian giáo viên.
- **Cá nhân hóa lộ trình học**: Mỗi học sinh có một lộ trình riêng dựa trên điểm yếu thực tế. AI tự động sinh bài tập ôn tập phù hợp, không học theo kiểu "một size cho tất cả".
- **Chẩn đoán chính xác**: Engine tổng hợp đa tín hiệu cho phép phát hiện sớm điểm yếu trước khi học sinh tụt lại quá xa. Độ tin cậy tăng dần theo số lượng bằng chứng thu thập.
- **Tự động hóa công việc giáo viên**: AI hỗ trợ chấm bài tự luận, gợi ý rubric, giảm tải cho giáo viên.

**2. Hiệu quả kinh tế:**

- **Chi phí thấp hơn gia sư truyền thống**: Một gia sư truyền thống có giá 150.000-300.000đ/giờ/học sinh. EduSelf với chi phí vận hành ~5.000-10.000đ/học sinh/tháng (chi phí API AI + máy chủ) có thể phục vụ đồng thời hàng nghìn học sinh.
- **Tiết kiệm thời gian giáo viên**: AI chấm sơ bộ bài tập, chẩn đoán điểm yếu, giúp giáo viên tập trung vào giảng dạy thay vì công việc hành chính. Ước tính giảm 30-40% thời gian chấm bài.
- **Khả năng mở rộng không giới hạn**: Không giống gia sư vật lý (1 kèm 1), AI có thể phục vụ hàng nghìn học sinh cùng lúc.

**3. Hiệu quả xã hội:**

- **Bình đẳng giáo dục**: Học sinh vùng sâu, vùng xa (nơi thiếu giáo viên giỏi) được tiếp cận trợ lý AI chất lượng cao, chỉ cần Internet.
- **Gắn kết gia đình - nhà trường**: Dashboard phụ huynh giúp cha mẹ nắm rõ tình hình học tập của con, chủ động hỗ trợ thay vì chỉ nhận sổ liên lạc cuối kỳ.
- **Tạo động lực học tập**: Gamification (kim cương, streak, huy hiệu, bảng xếp hạng) giúp học sinh hứng thú và duy trì thói quen học tập đều đặn.
- **Phát triển tư duy phản biện**: Phương pháp Socratic rèn luyện khả năng suy luận, đặt câu hỏi - kỹ năng quan trọng cho thế kỷ 21.
- **Hỗ trợ chuyển đổi số giáo dục**: Phù hợp với định hướng chuyển đổi số quốc gia trong lĩnh vực giáo dục.

---

## C. Toàn văn giải pháp dự thi

EduSelf được phát triển qua các giai đoạn:

1. **Nghiên cứu và thiết kế (2 tháng)**: Khảo sát nền tảng hiện có, xác định điểm yếu cần khắc phục. Thiết kế kiến trúc hệ thống (4 vai trò, 22 bảng dữ liệu, phân cấp nội dung 4 tầng). Thiết kế UI/UX lấy cảm hứng từ Notion + Duolingo.

2. **Phát triển nền tảng (3 tháng)**: Xây dựng authentication JWT, hệ thống phân quyền. Phát triển backend API (28+ endpoints). Xây dựng giao diện frontend cho 4 vai trò. Tích hợp PDF viewer với tracking từng trang.

3. **Tích hợp AI (1 tháng)**: Thiết kế 7 prompt templates cho các tác vụ khác nhau (Tutor, Exercise Generator, Grader, Quiz Generator, Completion Quiz, Learning Coach, Assignment Pre-grade). Phát triển engine chẩn đoán điểm yếu đa tín hiệu.

4. **Kiểm thử và hoàn thiện (1 tháng)**: Viết unit test, kiểm thử luồng người dùng, tối ưu hiệu năng. Cài đặt dữ liệu demo.

**Tổng thời gian**: 7 tháng.

**Công nghệ sử dụng**: Next.js 14, TypeScript, PostgreSQL, Prisma ORM, Tailwind CSS, OpenAI API, Cloudflare R2, Python FastAPI.

---

………Ngày … tháng … năm 2026

**Tác giả hoặc đại diện nhóm tác giả**

*(Ký, ghi rõ họ tên)*
