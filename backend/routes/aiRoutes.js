import express from 'express';
import { callOpenRouter, buildCompletionRequest } from '../services/aiService.js';

const router = express.Router();

/**
 * Middleware: Validate that the user provided their own OpenRouter API key.
 * The key is passed from the client as a custom header 'x-user-api-key',
 * ensuring the hosting environment is entirely free and decoupled from
 * any server-side credentials.
 */
function requireUserApiKey(req, res, next) {
  const userApiKey = req.headers['x-user-api-key'];

  if (!userApiKey || typeof userApiKey !== 'string' || !userApiKey.trim()) {
    return res.status(401).json({
      error: 'API Key missing. Please provide your own OpenRouter key in the application settings.'
    });
  }

  req.userApiKey = userApiKey;
  next();
}

/**
 * POST /api/ai/breakdown
 * 
 * Accepts parent task details and returns structured subtasks + standalone AI tasks.
 * 
 * Request body: { taskId, title, description }
 * Response: { subtasks: string[], standaloneTasks: Array<{text: string, isAI: true}> }
 * 
 * TODO: Replace simulated delay with actual LLM/NVIDIA inference call:
 * const response = await fetch('https://api.llm-provider.com/v1/breakdown', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.LLM_API_KEY}` },
 *   body: JSON.stringify({ taskId, title, description })
 * });
 * const data = await response.json();
 */
router.post('/breakdown', requireUserApiKey, async (req, res) => {
  try {
    const { taskId, title, description } = req.body;

    if (!taskId || !title) {
      return res.status(400).json({
        error: 'Missing required fields: taskId and title are required'
      });
    }

    const prompt = `You are an AI project management assistant. Break the task "${title}"${description ? ` (${description})` : ''} into 3-5 clear, actionable, short subtask strings. Respond ONLY with a flat JSON array of strings, e.g. ["Subtask A", "Subtask B", "Subtask C"]. No markdown, no extra text.`;

    const openrouterResponse = await callOpenRouter(req.userApiKey, buildCompletionRequest(prompt));

    const generatedText = openrouterResponse?.choices?.[0]?.message?.content || '';
    let subtasks;
    try {
      subtasks = JSON.parse(generatedText);
    } catch {
      subtasks = generatedText
        .split('\n')
        .map(l => l.trim().replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, ''))
        .filter(l => l.length > 0);
    }

    if (!Array.isArray(subtasks)) {
      subtasks = [];
    }

    res.json({ subtasks });
  } catch (err) {
    console.error('AI breakdown error:', err);
    if (err.status === 401) {
      return res.status(401).json({ error: 'Authentication failed with OpenRouter. Please check your API key in the application settings.' });
    }
    res.status(500).json({ error: 'Failed to generate breakdown' });
  }
});

/**
 * POST /api/ai/suggestions
 * 
 * Accepts current board structural layout and returns workflow suggestions.
 * 
 * Request body: { boardState: { columns: { todo, 'in-progress', review, done }, tasks: Task[] } }
 * Response: Array<{ id, title, priority: 'high'|'medium'|'low', recommendation: string }>
 * 
 * TODO: Replace simulated delay with actual LLM/NVIDIA inference call:
 * const response = await fetch('https://api.llm-provider.com/v1/suggestions', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.LLM_API_KEY}` },
 *   body: JSON.stringify({ boardState })
 * });
 * const data = await response.json();
 */
router.post('/suggestions', requireUserApiKey, async (req, res) => {
  try {
    const { boardState } = req.body;

    if (!boardState || !boardState.columns) {
      return res.status(400).json({
        error: 'Invalid boardState: columns object is required'
      });
    }

    const prompt = `You are an AI workflow optimization assistant for a Kanban board. Analyze the following board state and return exactly 3 distinct, concise, technical advice points identifying blockers or velocity improvements. Respond ONLY with a flat JSON object containing a "suggestions" key with an array of 3 strings, e.g. {"suggestions": ["Tip 1", "Tip 2", "Tip 3"]}. No markdown, no extra text.\n\nBoard state:\n${JSON.stringify(boardState)}`;

    const openrouterResponse = await callOpenRouter(req.userApiKey, buildCompletionRequest(prompt));

    const generatedText = openrouterResponse?.choices?.[0]?.message?.content || '';
    let parsed;
    try {
      parsed = JSON.parse(generatedText);
    } catch {
      parsed = { suggestions: analyzeBoardState(boardState) };
    }

    if (!parsed.suggestions || !Array.isArray(parsed.suggestions) || parsed.suggestions.length < 3) {
      parsed = { suggestions: analyzeBoardState(boardState) };
    } else {
      parsed.suggestions = parsed.suggestions.slice(0, 3);
    }

    res.json(parsed);
  } catch (err) {
    console.error('AI suggestions error:', err);
    if (err.status === 401) {
      return res.status(401).json({ error: 'Authentication failed with OpenRouter. Please check your API key in the application settings.' });
    }
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

export default router;

/**
 * Generate contextual subtasks for a parent task
 * @param {string} title - Parent task title
 * @param {string} description - Parent task description
 * @returns {string[]} Array of subtask strings
 */
function generateSubtasks(title, description) {
  const lowerTitle = title.toLowerCase();
  const lowerDesc = (description || '').toLowerCase();
  
  const subtaskTemplates = [
    `Research: ${title}`,
    `Analyze requirements for ${lowerTitle}`,
    `Create technical specification for ${lowerTitle}`,
    `Set up core structure for ${lowerTitle}`,
    `Implement primary logic for ${lowerTitle}`,
    `Configure integration points for ${lowerTitle}`,
    `Write unit tests for ${lowerTitle}`,
    `Perform integration testing for ${lowerTitle}`,
    `Code review for ${lowerTitle} implementation`,
    `Document API/changes for ${lowerTitle}`,
    `Create deployment checklist for ${lowerTitle}`,
    `Update changelog for ${lowerTitle}`
  ];

  let relevantTasks = [...subtaskTemplates];
  
  if (lowerTitle.includes('database') || lowerTitle.includes('schema') || lowerDesc.includes('database')) {
    relevantTasks = [
      `Design schema structures for ${lowerTitle}`,
      `Configure database indexing strategy`,
      `Verify relational foreign keys and constraints`,
      `Set up migration scripts for ${lowerTitle}`,
      `Test query performance and optimization`,
      `Document database changes for ${lowerTitle}`
    ];
  } else if (lowerTitle.includes('auth') || lowerTitle.includes('login') || lowerDesc.includes('auth')) {
    relevantTasks = [
      `Design authentication flow for ${lowerTitle}`,
      `Implement token management and refresh logic`,
      `Configure OAuth/SSO providers`,
      `Add rate limiting and security headers`,
      `Write auth integration tests`,
      `Document authentication API for ${lowerTitle}`
    ];
  } else if (lowerTitle.includes('ui') || lowerTitle.includes('component') || lowerTitle.includes('frontend')) {
    relevantTasks = [
      `Create component architecture for ${lowerTitle}`,
      `Implement responsive design patterns`,
      `Add accessibility (a11y) attributes`,
      `Write component unit tests`,
      `Storybook documentation for ${lowerTitle}`,
      `Visual regression testing setup`
    ];
  } else if (lowerTitle.includes('api') || lowerTitle.includes('endpoint') || lowerTitle.includes('route')) {
    relevantTasks = [
      `Define API contract for ${lowerTitle}`,
      `Implement request/response validation`,
      `Add error handling and logging`,
      `Write API integration tests`,
      `Generate OpenAPI/Swagger documentation`,
      `Configure rate limiting and caching`
    ];
  }

  return relevantTasks.slice(0, 4 + Math.floor(Math.random() * 3));
}

/**
 * Generate standalone AI tasks that can be spawned as external cards
 * @param {string} title - Parent task title
 * @param {string} description - Parent task description
 * @returns {Array<{text: string, isAI: true}>} Array of standalone task objects
 */
function generateStandaloneTasks(title, description) {
  const standaloneTemplates = [
    { text: `Refactor: ${title}`, isAI: true },
    { text: `Review: ${title}`, isAI: true },
    { text: `Optimize: ${title}`, isAI: true },
    { text: `Document: ${title}`, isAI: true },
    { text: `Test coverage: ${title}`, isAI: true },
    { text: `Monitor: ${title} performance`, isAI: true }
  ];

  const count = Math.floor(Math.random() * 3);
  return standaloneTemplates.slice(0, count);
}

/**
 * Analyze board state and generate workflow suggestions
 * @param {Object} boardState - Current board structural layout
 * @returns {Array} Array of suggestion objects
 */
function analyzeBoardState(boardState) {
  const { columns, tasks = [] } = boardState;
  const columnCounts = columns || {};
  const suggestions = [];

  const createSuggestion = (id, title, priority, recommendation) => ({
    id,
    title,
    priority,
    recommendation
  });

  if ((columnCounts.todo || 0) > 4) {
    suggestions.push(createSuggestion(
      `suggestion-${Date.now()}-1`,
      'To Do Column Bottleneck',
      'high',
      `AI Suggestion: 'To Do' has ${columnCounts.todo} tasks (threshold: 4). Consider prioritizing or breaking down large tasks to restore column flow.`
    ));
  }

  if ((columnCounts['in-progress'] || 0) > 3) {
    suggestions.push(createSuggestion(
      `suggestion-${Date.now()}-2`,
      'In Progress Overload',
      'high',
      `AI Suggestion: 'In Progress' has ${columnCounts['in-progress']} tasks (threshold: 3). Consider moving completed items to Review to restore column flow.`
    ));
  }

  if ((columnCounts.review || 0) > 3) {
    suggestions.push(createSuggestion(
      `suggestion-${Date.now()}-3`,
      'Review Column Stagnation',
      'medium',
      `AI Suggestion: 'Review' has ${columnCounts.review} tasks accumulating. Follow up on stale reviews to unblock progress.`
    ));
  }

  if ((columnCounts['in-progress'] || 0) === 0 && (columnCounts.todo || 0) > 0) {
    suggestions.push(createSuggestion(
      `suggestion-${Date.now()}-4`,
      'In Progress Idle',
      'medium',
      "AI Suggestion: 'In Progress' is empty while To Do has work. Pull the highest-priority task to maintain flow."
    ));
  }

  const highPriorityInTodo = tasks.filter(t => 
    t.status === 'todo' && t.priority === 'high'
  ).length;
  if (highPriorityInTodo > 2) {
    suggestions.push(createSuggestion(
      `suggestion-${Date.now()}-5`,
      'High Priority Backlog',
      'high',
      `AI Suggestion: ${highPriorityInTodo} high-priority tasks stuck in To Do. Consider expediting or re-prioritizing.`
    ));
  }

  const aiTasks = tasks.filter(t => t.isAI).length;
  if (aiTasks > 0) {
    suggestions.push(createSuggestion(
      `suggestion-${Date.now()}-6`,
      'AI-Generated Tasks Pending',
      'low',
      `AI Suggestion: ${aiTasks} AI-generated task(s) detected on board. Review and prioritize them for integration.`
    ));
  }

  const totalTasks = Object.values(columnCounts).reduce((sum, count) => sum + (count || 0), 0);
  if (totalTasks > 0) {
    for (const [column, count] of Object.entries(columnCounts)) {
      if (count && count / totalTasks > 0.5) {
        suggestions.push(createSuggestion(
          `suggestion-${Date.now()}-7`,
          'Column Imbalance Detected',
          'medium',
          `AI Suggestion: '${column}' holds ${count}/${totalTasks} tasks (${Math.round(count/totalTasks*100)}%). Redistribute work for better flow.`
        ));
        break;
      }
    }
  }

  return suggestions.slice(0, 3);
}
