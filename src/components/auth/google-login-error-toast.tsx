"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

const messages: Record<string, string> = {
  google_state_mismatch: "Phiên đăng nhập Google không hợp lệ. Vui lòng thử lại.",
  google_not_configured: "Google đăng nhập chưa được cấu hình.",
  google_token_failed: "Không thể xác thực với Google.",
  google_profile_failed: "Không thể lấy thông tin tài khoản Google.",
  google_auth_failed: "Đăng nhập Google thất bại.",
};

export function GoogleLoginErrorToast() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get("error");
    if (!error) return;

    toast.error(messages[error] || "Đăng nhập Google thất bại.");
  }, [searchParams]);

  return null;
}
