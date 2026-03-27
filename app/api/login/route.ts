import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { pool } from "@/lib/db";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "username and password are required" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      const result = await client.query(
        `SELECT id, username, password_hash FROM public.users WHERE username = $1 LIMIT 1`,
        [username]
      );

      console.log("LOGIN rows:", result.rows);

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "帳號或密碼錯誤" },
          { status: 401 }
        );
      }

      const user = result.rows[0];
      const isValid = await bcrypt.compare(password, user.password_hash);

      console.log("LOGIN isValid:", isValid);

      if (!isValid) {
        return NextResponse.json(
          { error: "帳號或密碼錯誤" },
          { status: 401 }
        );
      }

      const token = signToken({
        userId: user.id,
        username: user.username,
      });

      console.log("LOGIN token created");

      const response = NextResponse.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
        },
      });

      response.cookies.set("token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        path: "/",
        maxAge: 60 * 60 * 24,
      });

      return response;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("LOGIN API ERROR:", error);
    return NextResponse.json(
      { error: error.message || "login failed" },
      { status: 500 }
    );
  }
}