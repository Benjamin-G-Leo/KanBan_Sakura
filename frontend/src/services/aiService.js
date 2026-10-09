import { API_BASE } from '../components/constants';

async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP error ${response.status}`);
  }
  return response.json();
}

export async function getTaskBreakdown(taskId, taskData) {
  const response = await fetch(`${API_BASE}/ai/breakdown`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskId, ...taskData }),
  });
  return handleResponse(response);
}

export async function getWorkflowSuggestions(boardState) {
  const response = await fetch(`${API_BASE}/ai/suggestions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ boardState }),
  });
  return handleResponse(response);
}

export async function createTaskFromAI(taskData) {
  const response = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...taskData, isAI: true }),
  });
  return handleResponse(response);
}