import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeArticleWithOpenAI(input: {
  keyword: string;
  title: string;
  metaDescription: string;
  h1: string;
  h2List: string[];
  h3List: string[];
  contentText: string;
}) {
  const prompt = `
你是一位專業 SEO 內容分析助理。

請針對以下文章資料，分析：
1. 這篇文章是否符合關鍵字「${input.keyword}」的搜尋意圖
2. 以 E-E-A-T 架構評估：
   - Experience
   - Expertise
   - Authoritativeness
   - Trustworthiness
3. 抽取文章中的 entities（品牌、公司、產品、方案名、技術名詞、人物、地點等）
4. 計算 entity 個數會由系統自己處理，所以你只要輸出 entities array

請務必只輸出 JSON，不要有 markdown，不要有多餘文字。

文章資料如下：
title: ${input.title}
meta description: ${input.metaDescription}
h1: ${input.h1}
h2: ${JSON.stringify(input.h2List)}
h3: ${JSON.stringify(input.h3List)}
content:
${input.contentText.slice(0, 7000)}
`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "seo_article_analysis",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            summary: { type: "string" },
            search_intent_match: { type: "integer" },
            experience_score: { type: "integer" },
            expertise_score: { type: "integer" },
            authoritativeness_score: { type: "integer" },
            trustworthiness_score: { type: "integer" },
            strengths: {
              type: "array",
              items: { type: "string" },
            },
            weaknesses: {
              type: "array",
              items: { type: "string" },
            },
            entities: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  name: { type: "string" },
                  type: { type: "string" },
                },
                required: ["name", "type"],
              },
            },
          },
          required: [
            "summary",
            "search_intent_match",
            "experience_score",
            "expertise_score",
            "authoritativeness_score",
            "trustworthiness_score",
            "strengths",
            "weaknesses",
            "entities",
          ],
        },
      },
    },
    messages: [
      {
        role: "system",
        content: "你是嚴格輸出 JSON 的 SEO 分析助手。",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = response.choices[0]?.message?.content || "{}";

  try {
    return JSON.parse(content);
  } catch {
    return {
      summary: "解析失敗",
      search_intent_match: 0,
      experience_score: 0,
      expertise_score: 0,
      authoritativeness_score: 0,
      trustworthiness_score: 0,
      strengths: [],
      weaknesses: [],
      entities: [],
    };
  }
}