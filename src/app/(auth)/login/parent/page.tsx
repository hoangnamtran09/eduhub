import { RoleLoginForm } from "@/components/auth/role-login-form";

export default function ParentLoginPage() {
  return (
    <RoleLoginForm
      role="PARENT"
      title="Đăng nhập Phụ Huynh"
      description="Theo dõi quá trình học tập và kết quả của con."
    />
  );
}
