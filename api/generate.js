module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { messages, max_tokens } = req.body;
  const prompt = messages.map(m => m.content).join('\n');

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: max_tokens || 3000 }
        })
      }
    );

    const rawText = await response.text();
    console.log("Gemini raw response:", rawText);

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      console.error("Gemini did not return JSON:", rawText);
      return res.status(500).json({ 
        error: "Gemini API returned an unexpected response: " + rawText.slice(0, 200) 
      });
    }

    if (data.error) {
      console.error("Gemini API error:", data.error);
      return res.status(500).json({ 
        error: "Gemini error: " + data.error.message 
      });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!text) {
      console.error("No text in Gemini response:", JSON.stringify(data));
      return res.status(500).json({ error: "Gemini returned an empty response." });
    }

    res.status(200).json({
      content: [{ type: "text", text }]
    });

  } catch (err) {
    console.error("Handler error:", err);
    res.status(500).json({ error: err.message });
  }
}