export async function sendResultsToGoogleSheet(payload: {
  keyword: string;
  username: string;
  results: any[];
}) {
  const url = process.env.APPS_SCRIPT_WEB_APP_URL;

  if (!url) {
    throw new Error("APPS_SCRIPT_WEB_APP_URL is missing");
  }

  console.log("Sending to Apps Script URL:", url);
  console.log("Sending payload:", JSON.stringify(payload, null, 2));

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const text = await res.text();

  return {
    status: res.status,
    body: text,
  };
}