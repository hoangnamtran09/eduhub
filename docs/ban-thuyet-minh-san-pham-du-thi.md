# BẢN THUYẾT MINH MÔ HÌNH SẢN PHẨM THAM DỰ CUỘC THI

**SÁNG TẠO THANH THIÊU NIÊN NHI ĐỒNG CÀ MAU LẦN THỨ I (NĂM 2025 - 2026)**

---

## 1. Tên mô hình sản phẩm dự thi

**"EduSelf - Trợ lý Học tập AI Thông minh cho Học sinh Trung học"**

- **Lĩnh vực dự thi**: Phần mềm Tin học

---

## 2. Ý tưởng của người dự thi

**Xuất phát từ đâu?**

Là học sinh (và phụ huynh), em nhận thấy một thực tế: khi học bài ở nhà, nếu gặp một khái niệm khó hiểu, chúng em không biết hỏi ai. Giáo viên thì bận, bố mẹ có thể không chuyên môn, còn tìm trên mạng thì thông tin hỗn tạp, không biết đúng sai. Nhiều bạn trong lớp em học lực yếu dần vì những lỗ hổng kiến thức nhỏ không được phát hiện và sửa kịp thời.

Mặt khác, em cũng thấy bố mẹ luôn muốn biết con học hành thế nào nhưng chỉ có thể dựa vào sổ liên lạc họp phụ huynh cuối kỳ - quá muộn để can thiệp nếu con đang gặp khó khăn.

**Các sản phẩm đã có và hạn chế của chúng:**

- **Các trang web học trực tuyến (Hocmai, Tuyensinh247)**: Chủ yếu là video bài giảng ghi sẵn. Học sinh xem thụ động, không được tương tác. Nếu không hiểu phần nào thì không hỏi được. Không có cơ chế phát hiện "bạn yếu chỗ nào".

- **ChatGPT / AI Chatbot**: Có thể trả lời câu hỏi, nhưng không biết học sinh đang học bài gì, lớp mấy. AI cũng dễ "trả lời luôn đáp án" thay vì dạy học sinh cách suy nghĩ. Không có tracking tiến bộ, không báo cho phụ huynh.

**Vấn đề EduSelf giải quyết**: Tạo ra một "gia sư AI" luôn sẵn sàng 24/7, dạy bằng cách đặt câu hỏi dẫn dắt (không cho đáp án), tự động phát hiện điểm yếu và tạo bài tập ôn riêng, đồng thời giúp phụ huynh theo dõi sát sao việc học của con.

---

## 3. Thuyết minh tính mới, tính sáng tạo

**Điểm mới 1 - AI Tutor dạy theo phương pháp Socratic (dẫn dắt, không trả lời trực tiếp)**

- *Hạn chế cũ*: Chatbot thông thường khi học sinh hỏi "Đáp án bài này là gì?" sẽ trả lời luôn → học sinh không tự suy nghĩ.
- *Giải pháp mới*: AI được lập trình để luôn hỏi ngược lại: "Theo bạn, bước đầu tiên để giải bài này là gì?", "Bạn thử nghĩ xem, tại sao mình lại dùng công thức này?" → buộc học sinh phải động não.

**Điểm mới 2 - Hệ thống chẩn đoán điểm yếu từ đa tín hiệu**

- *Hạn chế cũ*: Các nền tảng chỉ đánh giá qua 1 bài kiểm tra. Nếu học sinh hôm đó mệt, làm sai → kết luận "yếu" là không chính xác.
- *Giải pháp mới*: EduSelf thu thập 5 nguồn tín hiệu: (1) điểm quiz trong lúc học, (2) điểm bài tập AI giao, (3) thời gian mắc kẹt ở một bài, (4) bài học chưa hoàn thành, (5) đánh giá từ giáo viên. Hệ thống chỉ kết luận "yếu" khi có đủ bằng chứng từ nhiều nguồn, giống như cách bác sĩ chẩn đoán bệnh cần nhiều xét nghiệm.

**Điểm mới 3 - AI tự động sinh bài tập ôn riêng cho từng điểm yếu**

- *Hạn chế cũ*: Bài tập ôn tập là giống nhau cho mọi học sinh.
- *Giải pháp mới*: Khi phát hiện học sinh A yếu chủ đề "Tập hợp và phần tử", AI sẽ sinh riêng 3 câu hỏi trắc nghiệm đúng chủ đề đó, kèm lời giải thích. Học sinh B yếu chủ đề khác sẽ nhận bộ câu hỏi khác.

**Điểm mới 4 - Dashboard cho phụ huynh với cảnh báo thông minh**

- *Hạn chế cũ*: Phụ huynh chỉ biết kết quả học tập qua sổ liên lạc hoặc họp phụ huynh.
- *Giải pháp mới*: Phụ huynh có dashboard riêng, xem thời gian học, bài tập hoàn thành, điểm yếu của con. Hệ thống gửi cảnh báo (mức critical/warning/good) khi con có dấu hiệu chểnh mảng. Phụ huynh có thể tạo tài khoản cho con và nhấn nút nhắc nhở qua email.

**Điểm mới 5 - AI nắm ngữ cảnh bài học hiện tại**

- *Hạn chế cũ*: AI thông thường không biết "học sinh đang học bài nào, môn gì, lớp mấy".
- *Giải pháp mới*: Mỗi khi học sinh chat, AI được cung cấp: tên bài học, nội dung bài học, môn học, khối lớp → câu trả lời chính xác và phù hợp trình độ.

---

## 4. Các vật liệu làm nên sản phẩm

EduSelf là sản phẩm phần mềm, các "vật liệu" chính là công nghệ và mã nguồn:

| Thành phần | Mô tả | Chi phí/Ghi chú |
|------------|-------|-----------------|
| **Next.js 14** | Framework frontend + backend (JavaScript/TypeScript) | Mã nguồn mở, miễn phí |
| **PostgreSQL** | Cơ sở dữ liệu quan hệ lưu trữ toàn bộ dữ liệu người dùng và học tập | Miễn phí (Neon serverless) |
| **Prisma ORM** | Công cụ quản lý database | Mã nguồn mở |
| **Tailwind CSS** | Thư viện thiết kế giao diện | Mã nguồn mở |
| **OpenAI API (qua Beeknoee)** | "Bộ não" AI xử lý chat, sinh bài tập, chấm điểm | Trả theo lượt dùng (~0.01-0.05$/lượt) |
| **Cloudflare R2** | Lưu trữ file PDF bài giảng | Miễn phí 10GB |
| **Python FastAPI** | Backend xử lý PDF | Mã nguồn mở |

**Ưu điểm về vật liệu:**
- Hầu hết công nghệ sử dụng là mã nguồn mở (miễn phí), giúp giảm chi phí phát triển.
- Chi phí vận hành chính chỉ là API AI (~200.000đ/tháng cho 1 trường ~500 học sinh).
- Không cần thiết bị đặc biệt, chỉ cần máy tính/điện thoại kết nối Internet.
- Nền tảng web nên chạy được trên mọi thiết bị (máy tính, tablet, điện thoại).

---

## 5. Cách lắp ráp, lắp đặt sản phẩm

**Thời gian phát triển**: Tổng cộng 7 tháng (từ nghiên cứu đến hoàn thiện).

**Các bước triển khai hệ thống:**

1. **Cài đặt môi trường**: Node.js, PostgreSQL, tài khoản Cloudflare R2, tài khoản API AI.
2. **Cấu hình**: Thiết lập biến môi trường (database URL, API key, JWT secret, storage credentials).
3. **Khởi tạo database**: Chạy Prisma migration để tạo 22 bảng dữ liệu.
4. **Nạp dữ liệu ban đầu**: Chạy seed script để tạo tài khoản admin, giáo viên demo, học sinh demo, môn học và thành tựu.
5. **Đưa nội dung lên**: Upload bài giảng (PDF, markdown) cho từng môn học.
6. **Khởi chạy**: Deploy lên máy chủ (Railway, Vercel, hoặc VPS).

**Hướng dẫn sử dụng:**

| Bước | Học sinh | Giáo viên | Phụ huynh |
|------|---------|----------|-----------|
| 1 | Đăng nhập tài khoản học sinh | Đăng nhập tài khoản giáo viên | Đăng nhập tài khoản phụ huynh |
| 2 | Chọn môn học → Bài học | Xem dashboard, quản lý học sinh | Xem dashboard, chọn con |
| 3 | Đọc bài giảng (PDF) + chat AI | Tạo bài tập, giao deadline | Xem thời gian học, điểm số |
| 4 | Làm quiz, bài tập AI | Chấm bài, xem AI pre-grade | Nhận cảnh báo nếu con chưa làm bài |
| 5 | Xem lộ trình cải thiện điểm yếu | Đánh dấu điểm yếu cho học sinh | Nhắc nhở con qua email |

**Vận hành**: Hệ thống chạy 24/7 trên máy chủ. Quản trị viên có thể thêm môn học, bài học, quản lý người dùng qua dashboard admin.

---

## 6. Thuyết minh nguyên lý hoạt động

**Sơ đồ nguyên lý tổng thể:**

```
[NGƯỜI DÙNG] ←→ [FRONTEND (Next.js + Tailwind)]
                      ↕
              [API ROUTES (Next.js)]
                      ↕
    ┌─────────────────┼─────────────────┐
    ↓                 ↓                  ↓
[Prisma ORM]    [AI SERVICE]     [STORAGE (R2)]
    ↓                 ↓
[PostgreSQL]    [OpenAI API]
```

**Nguyên lý hoạt động của AI Tutor:**

1. Khi học sinh mở bài học, hệ thống nạp nội dung bài giảng, môn học, khối lớp vào context.
2. Học sinh gửi tin nhắn → API `/api/ai/chat` nhận yêu cầu.
3. AI Service ghép `TUTOR_SYSTEM_PROMPT` + context bài học + lịch sử chat → gửi lên OpenAI API.
4. AI phản hồi theo phong cách Socratic (đặt câu hỏi dẫn dắt, không trả lời trực tiếp).
5. AI có thể nhúng `:::quiz` block trong phản hồi → frontend parse và hiển thị thành câu hỏi trắc nghiệm tương tác.
6. Học sinh trả lời quiz → hệ thống ghi nhận điểm, trao kim cương, và gửi tín hiệu đến weakness engine nếu điểm thấp.

**Nguyên lý hoạt động của Weakness Detection Engine:**

```
[Quiz <60%] ────→ weight 3-4 ────┐
[Exercise <70%] → weight 2.5 ────┤
[Stuck >30min] ─→ weight 1   ────┼──→ [AGGREGATOR] ──→ [Confidence Score]
[Incomplete] ───→ weight 1.5 ────┤         ↓
[Teacher mark] ─→ weight 3   ────┘   [Severity Score]
                                           ↓
                                    [AI Coach Generator]
                                           ↓
                              [Feedback + 3 Review Exercises]
```

Hệ thống tổng hợp tín hiệu với trọng số khác nhau, tính điểm tin cậy dựa trên số lượng và độ đa dạng của bằng chứng. Chỉ khi điểm tin cậy đủ cao, hệ thống mới kết luận điểm yếu và kích hoạt AI sinh nội dung ôn tập.

---

## 7. Khả năng áp dụng của sản phẩm

**Quy mô áp dụng:**
- Có thể triển khai cho 1 trường (500-2000 học sinh), 1 huyện/thành phố, hoặc toàn tỉnh Cà Mau.
- Hệ thống thiết kế để scale ngang: thêm máy chủ khi tăng người dùng.

**Mức độ khả năng triển khai:**
- Sẵn sàng triển khai thử nghiệm ngay.
- Chỉ cần: máy chủ + API key + nội dung bài giảng số.
- Không cần đầu tư phần cứng đặc biệt tại trường học.

**Khả năng thay thế / cạnh tranh:**
- Có thể thay thế giải pháp LMS nước ngoài (Khan Academy, Google Classroom) với chi phí thấp hơn và phù hợp chương trình Việt Nam hơn.
- Lợi thế cạnh tranh cốt lõi: AI Socratic + Chẩn đoán điểm yếu + Dashboard phụ huynh - chưa có sản phẩm nào tại Việt Nam tích hợp đủ 3 yếu tố này.

**Đối tượng sử dụng:**
- Học sinh THCS, THPT (lớp 6-12) - sử dụng đại trà.
- Giáo viên các trường - sử dụng để quản lý lớp, giao và chấm bài.
- Phụ huynh - sử dụng để theo dõi con.
- Có thể mở rộng xuống Tiểu học (lớp 4-5) khi có đủ nội dung.

**Định hướng phát triển thêm:**
- Thêm tính năng học nhóm (group study với AI moderator).
- Tích hợp nhận diện giọng nói (voice-to-text) cho học sinh nhỏ tuổi.
- Phát triển mobile app (hiện tại là web app responsive).
- Mở rộng nội dung cho tất cả các môn trong chương trình GDPT 2018.

---

## 8. Đảm bảo mang lại hiệu quả: kinh tế, xã hội, môi trường

**Hiệu quả kinh tế:**

| Chỉ tiêu | Gia sư truyền thống | EduSelf |
|----------|-------------------|---------|
| Chi phí/học sinh/tháng | 600.000 - 2.400.000đ | ~5.000 - 10.000đ (API + server) |
| Số học sinh/người dạy | 1 (1 kèm 1) | Hàng nghìn (AI không giới hạn) |
| Thời gian phục vụ | 2-3 giờ/tuần | 24/7 |
| Chấm điểm - phản hồi | Vài ngày | Vài giây |
| Báo cáo phụ huynh | Không có | Dashboard thời gian thực |

**Hiệu quả xã hội:**

1. **Bình đẳng giáo dục**: Học sinh ở vùng sâu, vùng xa, biên giới, hải đảo của tỉnh Cà Mau - nơi khó tiếp cận giáo viên giỏi và gia sư - được sử dụng trợ lý AI chất lượng tương đương học sinh thành phố. Chỉ cần có Internet.

2. **Tạo thói quen tự học**: Phương pháp Socratic rèn luyện tư duy độc lập. Học sinh không còn phụ thuộc vào "ai đó cho đáp án" mà học cách tự suy luận - kỹ năng quan trọng suốt đời.

3. **Kết nối gia đình - nhà trường**: Phụ huynh (đặc biệt là phụ huynh đi làm xa, ít thời gian kèm con) vẫn nắm được tình hình học tập qua dashboard và cảnh báo, can thiệp kịp thời trước khi con tụt dốc.

4. **Giảm áp lực cho giáo viên**: AI hỗ trợ chấm bài, phát hiện học sinh yếu, giúp giáo viên tập trung vào việc giảng dạy và kèm cặp những học sinh cần nhất.

5. **Định hướng chuyển đổi số**: Phù hợp với chủ trương chuyển đổi số trong giáo dục của tỉnh Cà Mau và quốc gia. Sản phẩm do chính người Việt phát triển, làm chủ công nghệ.

6. **Tác động môi trường**: Học tập trực tuyến giảm nhu cầu in ấn tài liệu giấy, giảm di chuyển (học sinh không cần đến lớp học thêm), góp phần giảm phát thải carbon.

**Đánh giá từ người dùng (mô phỏng từ dữ liệu demo):**
- Học sinh: Hứng thú hơn nhờ gamification (kim cương, streak, bảng xếp hạng). Cảm giác có "bạn học AI" đồng hành thay vì học một mình.
- Giáo viên: Tiết kiệm thời gian chấm bài, có công cụ phát hiện học sinh yếu chính xác hơn quan sát thủ công.
- Phụ huynh: Yên tâm hơn khi biết con đang học gì, tiến bộ ra sao mỗi ngày.

---

………Ngày … tháng … năm 2026

**Tác giả hoặc đại diện nhóm tác giả**

*(Ký, ghi rõ họ tên)*
