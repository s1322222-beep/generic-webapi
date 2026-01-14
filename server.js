async function callOpenAI(prompt) {
  const apiKey = process.env.OPENAI_API_KEY;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: prompt }
      ]
    })
  });

  const data = await response.json();
  const txt = data.choices[0].message.content;
  const obj = JSON.parse(txt);
  return obj;
}
