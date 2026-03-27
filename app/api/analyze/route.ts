import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { pool } from "@/lib/db";
import { fetchSerpResults } from "@/lib/serp";
import { scrapePage } from "@/lib/scrape";
import { analyzeArticleWithOpenAI } from "@/lib/openai";
import { sendResultsToGoogleSheet } from "@/lib/sheets";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromCookie();

    if (!currentUser) {
      return NextResponse.json({ error: "未登入" }, { status: 401 });
    }

    const { keyword } = await req.json();

    if (!keyword) {
      return NextResponse.json({ error: "keyword is required" }, { status: 400 });
    }

    const db = await pool.connect();

    try {
      const jobInsert = await db.query(
        `INSERT INTO analysis_jobs (keyword, user_id)
         VALUES ($1, $2)
         RETURNING id`,
        [keyword, currentUser.userId]
      );

      const jobId = jobInsert.rows[0].id;

      const serpResults = await fetchSerpResults(keyword);

      const finalResults = [];

      for (const item of serpResults) {
        const pageData = await scrapePage(item.url);

        const aiResult = await analyzeArticleWithOpenAI({
          keyword,
          title: pageData.title || item.title,
          metaDescription: pageData.metaDescription,
          h1: pageData.h1,
          h2List: pageData.h2List,
          h3List: pageData.h3List,
          contentText: pageData.contentText,
        });

        const entities = Array.isArray(aiResult.entities) ? aiResult.entities : [];
        const entityCount = entities.length;

        const inserted = await db.query(
          `INSERT INTO analysis_results
          (
            job_id,
            rank,
            title,
            url,
            snippet,
            meta_description,
            h1,
            h2_list,
            h3_list,
            content_text,
            content_length,
            entities,
            entity_count,
            eeat_json
          )
          VALUES
          (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14
          )
          RETURNING *`,
          [
            jobId,
            item.rank,
            pageData.title || item.title,
            item.url,
            item.snippet,
            pageData.metaDescription,
            pageData.h1,
            JSON.stringify(pageData.h2List),
            JSON.stringify(pageData.h3List),
            pageData.contentText,
            pageData.contentLength,
            JSON.stringify(entities),
            entityCount,
            JSON.stringify(aiResult),
          ]
        );

        finalResults.push(inserted.rows[0]);
      }

      try {
  const sheetResponse = await sendResultsToGoogleSheet({
    keyword,
    username: currentUser.username,
    results: finalResults,
  });

  console.log("SHEET RESPONSE STATUS:", sheetResponse.status);
  console.log("SHEET RESPONSE BODY:", sheetResponse.body);
} catch (sheetError) {
  console.error("Google Sheet 寫入失敗:", sheetError);
}

      return NextResponse.json({
        success: true,
        jobId,
        results: finalResults,
      });
    } finally {
      db.release();
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "analyze failed" },
      { status: 500 }
    );
  }
}