export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`;
      
      const response = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body)
      });

      const data = await response.json();
      res.status(200).json(data);
    } catch (err) {
      console.error("Gemini proxy error:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else if (req.method === "GET") {
    res.status(200).json({ message: "API is working! Use POST to send data." });
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
