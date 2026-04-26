# Plan: Nâng Cấp Assignment Workflow

## Mục tiêu
Hoàn thiện workflow bài tập để đạt mức production-ready:
- AI pre-grade có thể dùng trực tiếp trong UI admin/teacher.
- Chấm bài theo rubric từng tiêu chí.
- Học sinh nhận được feedback rõ ràng và notification đúng lúc.
- Trạng thái bài tập được chuẩn hóa, dễ mở rộng và ít bug.
- Assignment list hỗ trợ vận hành tốt khi dữ liệu lớn hơn.

## Phạm vi ưu tiên

### P0. Nối AI pre-grade vào UI review
Mục tiêu:
- Thêm nút `AI chấm sơ bộ` trong màn hình review submission của admin/teacher.
- Gọi API `POST /api/assignments/[recipientId]/ai-grade`.
- Đổ kết quả `aiScore`, `feedback`, `rubricScores` vào form review để người chấm chỉnh lại trước khi lưu.

Công việc:
1. Cập nhật `src/components/admin/assignments/assignment-card.tsx`
   - Thêm nút `AI chấm sơ bộ` cho recipient ở trạng thái `submitted` hoặc `returned`.
   - Thêm loading state riêng cho AI grading.
   - Hiển thị AI score, AI feedback và rubric prefill trong form chấm.
2. Nếu cần, mở rộng response shape ở UI types trong `src/types/assignment.ts`.
3. Chuẩn hóa fallback UX khi AI lỗi:
   - Hiển thị inline error thay vì chỉ `console.error`.

Tiêu chí hoàn thành:
- Reviewer có thể bấm AI pre-grade, xem kết quả ngay, sửa lại rồi bấm `Chấm`.

### P0. Chấm theo rubric thật
Mục tiêu:
- Không chỉ có điểm tổng, mà có thể nhập điểm/comment cho từng criterion.
- Tự động tính tổng điểm từ rubric.

Công việc:
1. Mở rộng form review trong `assignment-card.tsx`
   - Render danh sách criteria từ `assignment.rubric`.
   - Mỗi criterion có:
     - score
     - optional comment
2. Gửi `rubricScores` thật vào API review.
3. Trong API `src/app/api/admin/assignments/recipients/[recipientId]/review/route.ts`
   - Validate rubricScores.
   - Tự tính tổng score nếu rubric có dữ liệu.
   - Chỉ cho manual override nếu thật sự cần.
4. Student UI hiển thị rubric feedback ở `src/app/(dashboard)/assignments/page.tsx`.

Tiêu chí hoàn thành:
- Reviewer chấm từng tiêu chí, học sinh xem được rubric breakdown.

### P0. Notification cho lifecycle feedback
Mục tiêu:
- Học sinh không cần tự vào trang assignments mới biết có phản hồi.

Công việc:
1. Mở rộng `src/app/api/notifications/route.ts`
   - Thêm thông báo khi status là `reviewed`.
   - Thêm thông báo khi status là `returned`.
2. Nếu có feedback mới, ưu tiên notification hơn generic assignment reminder.
3. Gắn CTA dẫn thẳng tới `/assignments`.

Tiêu chí hoàn thành:
- Khi giáo viên chấm hoặc trả sửa, học sinh thấy thông báo rõ ràng.

### P1. Chuẩn hóa trạng thái assignment bằng enum
Mục tiêu:
- Tránh lỗi do string literal phân tán.

Công việc:
1. Cập nhật `prisma/schema.prisma`
   - Tạo enum `AssignmentRecipientStatus` với các giá trị:
     - `assigned`
     - `accepted`
     - `submitted`
     - `reviewed`
     - `returned`
2. Thay `status String` bằng enum.
3. Tạo type helper trong `src/types/assignment.ts`.
4. Refactor các file đang so sánh string trạng thái:
   - student assignments page
   - admin assignment card
   - progress API
   - notifications API
   - assignments API

Tiêu chí hoàn thành:
- Tất cả logic trạng thái dùng type-safe enum/value set thống nhất.

### P1. Nâng cấp filter/list cho student và admin
Mục tiêu:
- Quản lý bài tập dễ hơn khi số lượng tăng.

Công việc:
1. Student page `src/app/(dashboard)/assignments/page.tsx`
   - Thêm filter `reviewed`
   - Thêm filter `returned`
2. Admin page `src/app/(dashboard)/admin/assignments/page.tsx`
   - Filter theo lifecycle:
     - chưa nhận
     - đã nhận
     - chờ chấm
     - đã chấm
     - trả sửa
     - quá hạn
3. Thêm badge thống kê tương ứng trong admin list.

Tiêu chí hoàn thành:
- Reviewer dễ lọc bài cần chấm/sửa.
- Học sinh dễ lọc bài cần xem feedback hoặc nộp lại.

### P1. Hoàn thiện UX upload bài nộp
Mục tiêu:
- Workflow nộp bài linh hoạt và ít ma sát hơn.

Công việc:
1. Mở rộng `src/app/api/assignments/upload-submission/route.ts`
   - Hỗ trợ thêm `doc`, `docx`, `txt` nếu phù hợp.
2. Student UI:
   - Cho xóa file đã tải trước khi submit.
   - Preview tốt hơn cho ảnh/PDF nếu nhẹ.
   - Hiển thị giới hạn file rõ ràng.
3. Nếu có nhiều file, giới hạn số lượng hợp lý và báo lỗi rõ.

Tiêu chí hoàn thành:
- Học sinh có thể nộp bài bằng nhiều dạng file phổ biến và kiểm soát danh sách file tốt hơn.

### P2. Chuẩn hóa feedback history thành model riêng
Mục tiêu:
- Tối ưu cho audit, report, query và scale về sau.

Công việc:
1. Thay `feedbackHistory Json?` bằng model riêng, ví dụ `AssignmentFeedbackEvent`.
2. Mỗi event lưu:
   - recipientId
   - status
   - score
   - feedback
   - rubricScores
   - reviewerId
   - createdAt
3. Refactor API review và UI timeline để đọc từ relation thay vì JSON.

Tiêu chí hoàn thành:
- Feedback timeline queryable, dễ mở rộng báo cáo và audit log.

### P2. Siết ownership cho teacher
Mục tiêu:
- Nhiều giáo viên dùng chung hệ thống mà không chấm nhầm bài của nhau.

Công việc:
1. Trong API admin/teacher assignments và review:
   - Nếu role là `TEACHER`, chỉ thấy assignment do chính họ tạo.
   - Chỉ được review recipient thuộc assignment của mình.
2. Admin vẫn có full access.

Tiêu chí hoàn thành:
- Teacher chỉ thao tác đúng phạm vi được giao.

## Thứ tự triển khai đề xuất
1. AI pre-grade UI
2. Rubric scoring thật
3. Notification cho reviewed/returned
4. Filter trạng thái student/admin
5. Enum hóa status
6. Upload UX nâng cao
7. Feedback history model riêng
8. Ownership cho teacher

## Kiểm thử sau mỗi giai đoạn
- `npx prisma generate`
- Nếu đổi schema: `npx prisma db push`
- `npm run lint`
- `npx tsc --noEmit`
- Test tay các flow:
  - tạo assignment
  - nhận bài
  - nộp text
  - nộp file
  - AI pre-grade
  - chấm bài
  - trả sửa
  - nộp lại
  - xem feedback
  - xem notification

## Kết quả kỳ vọng
Sau các bước trên, assignment workflow sẽ đạt mức:
- giao bài -> nhận bài -> nộp bài -> AI pre-grade -> teacher review -> trả sửa/chấm -> nộp lại -> lịch sử feedback -> notification đầy đủ.
- Đây là mức đủ mạnh để dùng như một mini LMS thực thụ trong sản phẩm hiện tại.
