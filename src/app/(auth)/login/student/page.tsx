import { RoleLoginForm } from "@/components/auth/role-login-form";

export default function StudentLoginPage() {
  return (
    <RoleLoginForm
      role="STUDENT"
      title="Đăng nhập Học Sinh"
      description="Tiếp tục học bài, làm bài tập và theo dõi tiến độ của bạn."
      showGoogleLogin
    />
  );
}
