import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    // 最簡單寫死帳密
    if (username !== "admin" || password !== "123456") {
      return NextResponse.json(
        { error: "帳號或密碼錯誤" },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
    });

    // 登入成功後寫入 cookie
    response.cookies.set("auth", "true", {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "login failed" },
      { status: 500 }
    );
  }
}