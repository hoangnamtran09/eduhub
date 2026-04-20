import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    cookies().delete("token");
    
    return NextResponse.json({
      message: "Đăng xuất thành công"
    });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Có lỗi xảy ra trong quá trình đăng xuất" },
      { status: 500 }
    );
  }
}
