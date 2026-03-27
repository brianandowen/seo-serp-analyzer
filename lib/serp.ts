export type SerpResult = {
  rank: number;
  title: string;
  url: string;
  snippet: string;
};

export async function fetchSerpResults(keyword: string): Promise<SerpResult[]> {
  const params = new URLSearchParams({
    engine: "google",
    q: keyword,
    api_key: process.env.SERPAPI_API_KEY || "",
    num: "10",
    hl: "zh-TW",
    gl: "tw",
  });

  const url = `https://serpapi.com/search?${params.toString()}`;

  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`SerpApi request failed: ${res.status}`);
  }

  const data = await res.json();

  const organicResults = data.organic_results || [];

  return organicResults.slice(0, 10).map((item: any, index: number) => ({
    rank: item.position || index + 1,
    title: item.title || "",
    url: item.link || "",
    snippet: item.snippet || "",
  }));
}