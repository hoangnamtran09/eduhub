# Assignment Workflow Test Checklist

## Mục tiêu
Checklist kiểm thử thủ công và định hướng E2E cho toàn bộ assignment workflow đa vai trò.

## Vai trò
- Student
- Teacher
- Admin
- Parent

## 1. Student Flow
### Nhận bài
- Đăng nhập bằng tài khoản học sinh.
- Mở `/assignments`.
- Xác nhận bài mới xuất hiện ở trạng thái `Chưa nhận`.
- Mở dialog chi tiết bài tập.
- Nếu có PDF đính kèm, xác nhận thông báo tải file hiển thị đúng.
- Bấm `Nhận bài tập`.
- Xác nhận:
  - toast thành công xuất hiện
  - trạng thái đổi sang `Đã nhận`
  - notification center được refresh

### Nộp bài text/file
- Mở dialog `Nộp bài`.
- Nhập text bài làm.
- Upload 1 file ảnh.
- Xác nhận preview ảnh xuất hiện trong dialog.
- Upload 1 file PDF.
- Xác nhận preview PDF xuất hiện trong dialog.
- Chọn 1 file office/txt.
- Xác nhận fallback "không preview trực tiếp" hiển thị đúng.
- Xóa một file trước khi submit.
- Xác nhận file bị gỡ khỏi danh sách và preview cập nhật đúng.
- Bấm `Nộp bài`.
- Xác nhận:
  - toast thành công
  - trạng thái đổi sang `Đã nộp`
  - file/text hiển thị đúng trong card

### Nhận feedback
- Sau khi giáo viên chấm, refresh hoặc mở notification center.
- Xác nhận notification `Bài tập đã được chấm` xuất hiện.
- Mở assignment card.
- Xác nhận:
  - điểm hiển thị đúng
  - feedback hiển thị đúng
  - rubric breakdown hiển thị đúng
  - feedback timeline có event mới

### Returned / nộp lại
- Sau khi giáo viên `Trả sửa`, xác nhận notification `Bài tập cần chỉnh sửa` xuất hiện.
- Mở assignment card.
- Xác nhận:
  - badge `Cần sửa`
  - feedback cần sửa hiển thị rõ
  - có thể bấm `Nộp lại bài đã sửa`
- Nộp lại bài.
- Xác nhận số lần nộp tăng và timeline có thêm event.

## 2. Teacher Flow
### Tạo bài
- Đăng nhập teacher.
- Mở `/admin/assignments`.
- Tạo assignment mới:
  - có rubric
  - có due date
  - giao theo studentIds
- Xác nhận assignment xuất hiện trong danh sách.
- Bấm `Mở chi tiết`.
- Xác nhận trang detail load đúng dữ liệu.

### AI pre-grade
- Mở submission ở trạng thái `Chờ chấm`.
- Bấm `AI chấm sơ bộ`.
- Xác nhận:
  - loading hiển thị
  - toast thành công hoặc lỗi rõ ràng
  - AI score/fallback feedback được đổ vào form
- Bấm `Dùng điểm AI làm mẫu`.
- Xác nhận form được prefill đúng.

### Review rubric
- Nhập score/comment cho từng criterion.
- Xác nhận tổng điểm tự cộng đúng.
- Bấm `Chấm điểm`.
- Xác nhận:
  - toast thành công
  - trạng thái đổi `Đã chấm`
  - notification event được dispatch
  - timeline có event review mới

### Return
- Với submission khác, bấm `Trả lại sửa`.
- Xác nhận:
  - toast thành công
  - trạng thái đổi `Trả lại sửa`
  - timeline có event return mới

### Ownership
- Teacher A không thấy assignment do Teacher B tạo.
- Teacher A không thể review recipient thuộc assignment của Teacher B nếu gọi API trực tiếp.

## 3. Admin Flow
### Toàn quyền
- Đăng nhập admin.
- Xác nhận admin thấy toàn bộ assignment.
- Mở trang detail của assignment bất kỳ.
- Chấm/return bình thường.

### Export report
- Trên trang detail assignment, bấm `Xuất báo cáo Excel-compatible`.
- Xác nhận file `.csv` tải xuống.
- Mở bằng Excel/Sheets.
- Xác nhận các cột sau đúng:
  - assignment_title
  - subject
  - lesson
  - student_name
  - student_email
  - grade_level
  - status
  - attempt_count
  - ai_score
  - score
  - feedback
  - submitted_at
  - reviewed_at
  - returned_at
  - rubric_*_score
  - rubric_*_comment

## 4. Parent Flow
- Đăng nhập parent.
- Xác nhận notification về bài sắp hạn/quá hạn của con hoạt động đúng.
- Xác nhận child dashboard card hiển thị trạng thái assignment đúng sau review/return.

## 5. Regression
- Dashboard student vẫn tính đúng `pendingAssignments`.
- Topbar notification refresh đúng sau các action assignment.
- Search/filter ở student assignments vẫn hoạt động.
- Search/filter ở admin assignments vẫn hoạt động.
- Không lỗi TypeScript/lint sau các thay đổi.

## Định hướng E2E Specs
- `assignment-student-submit-preview.spec.ts`
- `assignment-teacher-review-ai.spec.ts`
- `assignment-admin-export.spec.ts`
- `assignment-teacher-ownership.spec.ts`
- `assignment-notification-refresh.spec.ts`
