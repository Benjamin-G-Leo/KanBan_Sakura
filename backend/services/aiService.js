const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export function buildCompletionRequest(prompt, systemPrompt = 'You are a project management AI assistant that responds with concise, structured JSON.') {
  return {
    model: 'openrouter/free',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    temperature: 0.4,
  };
}

export async function callOpenRouter(userApiKey, payload) {
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userApiKey}`,
      'HTTP-Referer': 'http://localhost:5173',
      'X-Title': 'Kanban AI Assistant',
    },
    body: JSON.stringify(payload),
  });

  const rawText = await response.text();
  let data = {};

  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { error: { message: rawText } };
    }
  }

  if (!response.ok) {
    const message = data?.error?.message || data?.message || `OpenRouter request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data;
}
