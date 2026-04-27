import { RoleLoginForm } from "@/components/auth/role-login-form";

export default function TeacherLoginPage() {
  return (
    <RoleLoginForm
      role="TEACHER"
      title="Đăng nhập Giáo viên"
      description="Quản lý lớp học, giao bài và theo dõi học sinh."
    />
  );
}
