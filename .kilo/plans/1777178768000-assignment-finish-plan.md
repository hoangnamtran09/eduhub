# Plan: Hoàn Thiện Assignment Workflow Endgame

## Mục tiêu
Khép kín phần assignment workflow ở mức production-ready với 5 hạng mục cuối:
1. Preview ảnh/PDF ngay trong dialog nộp bài.
2. Toast/notification realtime ngay sau khi review.
3. Export/report cho assignment review.
4. Trang admin chi tiết riêng cho một assignment.
5. E2E/manual test checklist cho toàn bộ flow nhiều vai trò.

## Nguyên tắc triển khai
- Ưu tiên thay đổi nhỏ nhưng đúng kiến trúc hiện tại.
- Tách hạng mục theo lớp: UX client, API/report, admin detail page, kiểm thử.
- Không đập bỏ assignment card hiện có ngay; giữ card làm entry point rồi link sang trang chi tiết.
- Mọi thay đổi phải giữ tương thích với workflow đang chạy: create -> accept -> submit -> AI pre-grade -> review -> return -> resubmit.

## Thứ tự triển khai đề xuất
1. Preview ảnh/PDF trong submit dialog
2. Toast/notification realtime sau review
3. Trang admin chi tiết assignment
4. Export/report cho assignment review
5. E2E/manual test checklist

---

## P0. Preview ảnh/PDF ngay trong dialog nộp bài

### Mục tiêu
Giảm ma sát cho học sinh khi nộp bài, cho phép kiểm tra file ngay trong dialog thay vì chỉ mở link mới.

### Phạm vi
- `src/app/(dashboard)/assignments/page.tsx`
- Có thể tách helper preview component mới nếu file quá dài:
  - `src/components/assignments/submission-file-preview.tsx`

### Công việc
1. Trong dialog nộp bài:
   - Detect file type từ `submissionFiles[].type`.
   - Nếu là ảnh: render thumbnail/preview inline.
   - Nếu là PDF: render preview panel bằng `iframe` hoặc object embed tối giản.
   - Nếu là file office/txt: giữ link tải/xem ngoài.
2. Với file đã upload:
   - Cho chọn file đang preview.
   - Giữ nút xóa file đã gắn.
3. UX fallback:
   - Nếu preview fail, hiển thị message “Không xem trước được file này”.
   - Mobile: preview co giãn, không làm dialog quá cao.

### Tiêu chí hoàn thành
- Ảnh xem được thumbnail ngay trong dialog.
- PDF xem được preview cơ bản ngay trong dialog.
- File không preview được vẫn có link mở/tải.

### Rủi ro/kỹ thuật
- `iframe` PDF có thể khác nhau theo browser, cần fallback sang link mở file.
- Không dùng viewer nặng nếu chưa cần.

---

## P0. Toast/notification realtime ngay sau khi review

### Mục tiêu
Người review và học sinh có phản hồi tức thì sau hành động chấm/trả sửa, không phải đợi refetch im lặng.

### Phạm vi
- `src/components/admin/assignments/assignment-card.tsx`
- `src/components/layout/dashboard-topbar.tsx`
- `src/app/api/notifications/route.ts`
- Có thể thêm event convention chung ở client

### Công việc
1. Admin review UI:
   - Sau `submitReview`, hiển thị toast thành công/thất bại rõ ràng.
   - Sau `runAiPregrade`, hiển thị toast thành công/thất bại.
2. Client event bus nhẹ:
   - Sau review/return thành công, dispatch event kiểu `assignment-reviewed`.
   - `dashboard-topbar.tsx` lắng nghe event này và refetch notification center ngay.
3. Student side:
   - Nếu học sinh đang mở dashboard/assignments và có polling nhẹ hoặc event local sau submit/review flow thì refresh list/notifications.
4. Nếu project đã có toast system thì dùng luôn.
   - Nếu chưa có, tạo toast tối giản dùng component có sẵn hoặc alert host nhỏ.

### Tiêu chí hoàn thành
- Reviewer thấy toast ngay sau chấm/trả sửa.
- Notification center cập nhật ngay trong session reviewer/student khi có trigger phù hợp.

### Ghi chú
- Realtime ở đây ưu tiên “near realtime trong session” bằng event + refetch, chưa cần WebSocket.

---

## P1. Trang admin chi tiết riêng cho một assignment

### Mục tiêu
Chuyển từ review ngay trong card sang một màn hình chuyên sâu, dễ scale khi số học sinh/file/feedback tăng.

### Phạm vi
- Route mới:
  - `src/app/(dashboard)/admin/assignments/[assignmentId]/page.tsx`
- API mới nếu cần:
  - `src/app/api/admin/assignments/[assignmentId]/route.ts`
- Cập nhật link từ:
  - `src/components/admin/assignments/assignment-card.tsx`

### Công việc
1. Tạo trang chi tiết assignment:
   - Header: title, lesson, dueDate, maxScore, rubric, số học sinh theo trạng thái.
   - Tabs/sections:
     - Tổng quan
     - Chờ chấm
     - Đã chấm
     - Trả sửa
2. Mỗi recipient row/card có:
   - trạng thái
   - số lần nộp
   - bài nộp text/file
   - AI pre-grade block
   - form review rubric
   - feedback timeline
3. Assignment card hiện tại:
   - Giảm bớt review nặng inline
   - Thêm CTA `Mở chi tiết`
4. Nếu cần, giữ review nhanh ở card cho assignment nhỏ, nhưng trang detail là luồng chính.

### Tiêu chí hoàn thành
- Admin có thể quản lý trọn một assignment trên trang riêng.
- Assignment card chỉ còn vai trò overview + điều hướng.

### Lợi ích
- Dễ thêm export, filter, analytics, bulk actions sau này.

---

## P1. Export/report cho assignment review

### Mục tiêu
Cho admin/teacher xuất kết quả review thành file dùng được ngoài hệ thống.

### Phạm vi
- API mới:
  - `src/app/api/admin/assignments/[assignmentId]/export/route.ts`
- Trang detail assignment sẽ gọi API này

### Định dạng đề xuất
1. CSV trước
2. PDF report summary sau nếu cần

### Công việc
1. API export CSV:
   - Thông tin assignment: title, lesson, due date, max score
   - Mỗi recipient:
     - student name/email
     - grade
     - status
     - attemptCount
     - aiScore
     - score
     - feedback
     - reviewedAt
     - returnedAt
2. Nếu có rubric:
   - flatten rubric score ra các cột:
     - `rubric_Content_score`
     - `rubric_Content_comment`
3. UI:
   - Nút `Xuất CSV` ở admin detail page
4. Nếu role là TEACHER:
   - Chỉ export assignment của mình

### Tiêu chí hoàn thành
- Có thể tải CSV đúng dữ liệu hiện tại của assignment.
- Mở được bằng Sheets/Excel.

---

## P2. E2E/manual test checklist nhiều vai trò

### Mục tiêu
Đảm bảo workflow ổn định trước khi coi là xong hoàn toàn.

### Phạm vi
- Tài liệu test nội bộ:
  - `.kilo/plans/assignment-workflow-test-checklist.md`
- Nếu project đang dùng Playwright/Cypress thì có thể thêm test sau

### Checklist manual tối thiểu
1. Student
   - Nhận bài có PDF
   - Nộp text only
   - Nộp file only
   - Nộp text + file
   - Xóa file trước submit
   - Nhận feedback reviewed
   - Nhận feedback returned
   - Nộp lại sau khi returned
   - Xem timeline feedback events
   - Xem preview ảnh/PDF
2. Teacher
   - Tạo assignment có rubric
   - Giao theo studentIds
   - Giao theo grade level
   - Chạy AI pre-grade
   - Dùng AI score làm mẫu
   - Chấm theo rubric
   - Trả sửa
   - Chỉ thấy assignment của mình
3. Admin
   - Thấy toàn bộ assignment
   - Review assignment bất kỳ
   - Export CSV
4. Notifications
   - Reviewed notification
   - Returned notification
   - Overdue notification không ghi đè sai reviewed/returned
5. Regression
   - Progress/dashboard vẫn tính đúng pending assignments
   - Sidebar/topbar notifications vẫn hoạt động

### Nếu bổ sung E2E sau
Ưu tiên các spec:
- `assignment-student-flow.spec.ts`
- `assignment-teacher-review.spec.ts`
- `assignment-admin-export.spec.ts`

---

## Phân chia thực hiện theo lượt

### Lượt 1
- Preview ảnh/PDF
- Toast/event realtime

### Lượt 2
- Admin assignment detail page
- Chuyển CTA từ card sang detail

### Lượt 3
- Export CSV
- Test checklist manual

---

## Tiêu chí hoàn thành cuối cùng
Khi hoàn tất plan này, assignment workflow sẽ đạt mức “done” nếu:
- Student có thể tự tin kiểm tra file trước khi nộp.
- Teacher/admin review có phản hồi tức thì.
- Admin có màn detail riêng để xử lý assignment lớn.
- Có export/report usable bên ngoài hệ thống.
- Có checklist test đa vai trò để regression ổn định.

## Kiểm tra sau mỗi lượt
- `npx prisma generate`
- Nếu đổi schema: `npx prisma db push`
- `npm run lint`
- `npx tsc --noEmit`
- Test tay theo checklist tương ứng
