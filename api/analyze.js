// api/analyze.js
export default async function handler(req, res) {
  try {
    const GEMINI_URL =
      "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent";

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();

    // Forward response & status for easier debugging
    res.status(response.status).json(data);
  } catch (err) {
    console.error("Gemini proxy error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
