"use client";

import { useState } from "react";

type ResultRow = {
  id: number;
  rank: number;
  title: string;
  url: string;
  meta_description: string;
  h1: string;
  content_length: number;
  entity_count: number;
  eeat_json: {
    summary?: string;
    search_intent_match?: number;
    experience_score?: number;
    expertise_score?: number;
    authoritativeness_score?: number;
    trustworthiness_score?: number;
    strengths?: string[];
    weaknesses?: string[];
  };
};

export default function HomePage() {
  const [keyword, setKeyword] = useState("4G吃到飽");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [error, setError] = useState("");

  async function handleAnalyze() {
    setLoading(true);
    setError("");
    setResults([]);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ keyword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "分析失敗");
        return;
      }

      setResults(data.results || []);
    } catch {
      setError("分析失敗");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">SEO SERP Analyzer</h1>
          <button
            onClick={handleLogout}
            className="rounded-lg bg-red-500 px-4 py-2 text-white"
          >
            登出
          </button>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">關鍵字分析</h2>

          <div className="flex gap-3">
            <input
              className="flex-1 rounded-lg border px-4 py-2"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="請輸入關鍵字"
            />
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="rounded-lg bg-black px-6 py-2 text-white"
            >
              {loading ? "分析中..." : "開始分析"}
            </button>
          </div>

          {error && <p className="mt-4 text-red-500">{error}</p>}
        </div>

        <div className="space-y-4">
          {results.map((row) => {
            const eeat = row.eeat_json || {};

            return (
              <div key={row.id} className="rounded-2xl bg-white p-6 shadow">
                <div className="mb-2 text-sm text-gray-500">排名 #{row.rank}</div>
                <h3 className="text-xl font-bold mb-2">{row.title}</h3>
                <a
                  href={row.url}
                  target="_blank"
                  className="text-blue-600 break-all"
                >
                  {row.url}
                </a>

                <div className="mt-4 space-y-2 text-sm">
                  <p><span className="font-semibold">Meta：</span>{row.meta_description || "無"}</p>
                  <p><span className="font-semibold">H1：</span>{row.h1 || "無"}</p>
                  <p><span className="font-semibold">內容長度：</span>{row.content_length}</p>
                  <p><span className="font-semibold">Entity 數量：</span>{row.entity_count}</p>
                  <p><span className="font-semibold">摘要：</span>{eeat.summary || "無"}</p>
                  <p><span className="font-semibold">搜尋意圖符合度：</span>{eeat.search_intent_match || 0}</p>
                  <p>
                    <span className="font-semibold">E-E-A-T：</span>
                    Experience {eeat.experience_score || 0} /
                    Expertise {eeat.expertise_score || 0} /
                    Authority {eeat.authoritativeness_score || 0} /
                    Trust {eeat.trustworthiness_score || 0}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}