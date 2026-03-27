import { NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const currentUser = await getCurrentUserFromCookie();

    if (!currentUser) {
      return NextResponse.json({ error: "未登入" }, { status: 401 });
    }

    const db = await pool.connect();

    try {
      const jobs = await db.query(
        `SELECT id, keyword, created_at
         FROM analysis_jobs
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [currentUser.userId]
      );

      return NextResponse.json({
        success: true,
        jobs: jobs.rows,
      });
    } finally {
      db.release();
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "history failed" },
      { status: 500 }
    );
  }
}