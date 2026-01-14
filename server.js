const express = require("express");
const fs = require("fs");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static("public"));

const MODEL = "gpt-4o-mini";
const OPENAI_API_ENDPOINT = "https://api.openai.com/v1/chat/completions";

// prompt.md を読む
let promptTemplate = "";
try {
  promptTemplate = fs.readFileSync("prompt.md", "utf8");
} catch (e) {
  console.error("prompt.md が読めません:", e);
  process.exit(1);
}

app.post("/api/", async (req, res) => {
  try {
    // フロントから {prompt: "..."} でも {text: "..."} でも受け取れるようにする
    const userText = (req.body?.prompt ?? req.body?.text ?? "").toString().trim();
    if (!userText) return res.status(400).json({ error: "prompt/text is empty" });

    // ${text} を置換
    const finalPrompt = promptTemplate.replace(/\$\{text\}/g, userText);

    const resultObj = await callOpenAI(finalPrompt);

    // フロントは j.data を見てるので data に入れて返す
    res.json({ title: "AI Fortune Canvas", data: resultObj });
  } catch (e) {
    console.error("API Error:", e);
    res.status(500).json({ error: e.message });
  }
});

async function callOpenAI(systemPrompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY environment variable is not set");

  const response = await fetch(OPENAI_API_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "system", content: systemPrompt }],
      max_completion_tokens: 800,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || "OpenAI API error");
  }

  const data = await response.json();
  const txt = data?.choices?.[0]?.message?.content ?? "{}";

  // ★ここが重要：配列じゃなくて “オブジェクト” をそのまま返す
  let obj;
  try {
    obj = JSON.parse(txt);
  } catch {
    throw new Error("LLM response JSON parse failed");
  }

  // 足りないキーがあっても落ちないように最低限補完（保険）
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    throw new Error("LLM response is not an object");
  }

  // 期待キーが欠けてたら保険で補完（画面が白固定にならない）
  if (typeof obj.fortune !== "string") obj.fortune = "今日は落ち着いて進めると良い日";
  if (typeof obj.luck !== "number") obj.luck = 0.5;
  if (typeof obj.color !== "string") obj.color = "#ffffff";
  if (typeof obj.shape !== "string") obj.shape = "circle";
  if (typeof obj.mood !== "string") obj.mood = "calm";

  return obj;
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
