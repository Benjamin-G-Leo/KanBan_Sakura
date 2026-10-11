import { API_BASE } from '../components/constants';

async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || error.error || `HTTP error ${response.status}`);
  }
  return response.json();
}

function checkApiKey() {
  const apiKey = localStorage.getItem('openrouter_api_key');
  if (!apiKey || !apiKey.trim()) {
    window.alert('API Key missing. Please provide your own OpenRouter key in the application settings.');
    throw new Error('API Key missing. Please provide your own OpenRouter key in the application settings.');
  }
  return apiKey.trim();
}

export async function getTaskBreakdown(taskId, taskData) {
  const apiKey = checkApiKey();
  const response = await fetch(`${API_BASE}/ai/breakdown`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-API-Key': apiKey
    },
    body: JSON.stringify({ taskId, ...taskData }),
  });
  return handleResponse(response);
}

export async function getWorkflowSuggestions(boardState) {
  const apiKey = checkApiKey();
  const response = await fetch(`${API_BASE}/ai/suggestions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-API-Key': apiKey
    },
    body: JSON.stringify({ boardState }),
  });
  return handleResponse(response);
}

export async function createTaskFromAI(taskData) {
  const apiKey = checkApiKey();
  const response = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-API-Key': apiKey
    },
    body: JSON.stringify({ ...taskData, isAI: true }),
  });
  return handleResponse(response);
}