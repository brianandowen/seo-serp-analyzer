import * as cheerio from "cheerio";

function cleanText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch HTML: ${res.status}`);
    }

    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

export async function scrapePage(url: string) {
  try {
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);

    const title = cleanText($("title").first().text() || "");
    const metaDescription = cleanText(
      $('meta[name="description"]').attr("content") || ""
    );
    const h1 = cleanText($("h1").first().text() || "");

    const h2List = $("h2")
      .map((_, el) => cleanText($(el).text()))
      .get()
      .filter(Boolean);

    const h3List = $("h3")
      .map((_, el) => cleanText($(el).text()))
      .get()
      .filter(Boolean);

    const paragraphs = $("p")
      .map((_, el) => cleanText($(el).text()))
      .get()
      .filter(Boolean);

    const contentText = paragraphs.join("\n").slice(0, 10000);

    return {
      title,
      metaDescription,
      h1,
      h2List,
      h3List,
      contentText,
      contentLength: contentText.length,
    };
  } catch (error) {
    return {
      title: "",
      metaDescription: "",
      h1: "",
      h2List: [] as string[],
      h3List: [] as string[],
      contentText: "",
      contentLength: 0,
    };
  }
}