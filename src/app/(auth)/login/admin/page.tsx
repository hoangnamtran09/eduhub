import { RoleLoginForm } from "@/components/auth/role-login-form";

export default function AdminLoginPage() {
  return (
    <RoleLoginForm
      role="ADMIN"
      title="Đăng nhập Admin"
      description="Truy cập khu vực quản trị hệ thống."
    />
  );
}
