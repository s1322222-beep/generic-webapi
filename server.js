const express = require('express');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static('public'));

const PROVIDER = 'openai'; // or 'gemini'
const MODEL = 'gpt-4o-mini';

let promptTemplate = fs.readFileSync('prompt.md', 'utf8');

const OPENAI_API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

app.post('/api/', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text" });

    const prompt = promptTemplate.replace(/\$\{text\}/g, text);

    const result = await callOpenAI(prompt);
    res.json(result);

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

async function callOpenAI(prompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");

  const response = await fetch(OPENAI_API_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: prompt }
      ],
      response_format: { type: "json_object" }
    })
  });

  const data = await response.json();
  const txt = data.choices[0].message.content;
  return JSON.parse(txt);
}

app.listen(PORT, () => {
  console.log("Server running on " + PORT);
});
