const requests = new Map();

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Rate limiting — 5 requests per IP per hour
  const ip = req.headers['x-forwarded-for'] || 'unknown';
  const now = Date.now();
  const hourMs = 60 * 60 * 1000;
  const record = requests.get(ip) || { count: 0, start: now };

  if (now - record.start > hourMs) {
    requests.set(ip, { count: 1, start: now });
  } else if (record.count >= 5) {
    return res.status(429).json({
      error: { message: "Too many requests. Please try again in an hour." }
    });
  } else {
    requests.set(ip, { count: record.count + 1, start: record.start });
  }

  // Groq API call
  const { messages, max_tokens } = req.body;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: max_tokens || 1500,
        messages
      })
    });

    const rawText = await response.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      return res.status(500).json({ error: "Unexpected response: " + rawText.slice(0, 200) });
    }

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const text = data.choices?.[0]?.message?.content || "";
    res.status(200).json({
      content: [{ type: "text", text }]
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}