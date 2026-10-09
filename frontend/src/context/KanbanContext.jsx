import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { API_URL } from '../components/constants';
import { getTaskBreakdown, getWorkflowSuggestions, createTaskFromAI } from '../services/aiService';

const KanbanContext = createContext(null);

const initialState = {
  tasks: [],
  loading: true,
  breakingDown: null,
  suggestionsOpen: false,
  suggestions: [],
  suggestionsLoading: false,
};

function kanbanReducer(state, action) {
  switch (action.type) {
    case 'SET_TASKS':
      return { ...state, tasks: action.payload, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((task) => (task.id === action.payload.id ? action.payload : task)),
      };
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter((task) => task.id !== action.payload),
      };
    case 'REORDER_TASKS':
      return { ...state, tasks: action.payload };
    case 'SET_BREAKING_DOWN':
      return { ...state, breakingDown: action.payload };
    case 'ADD_SUBTASKS':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload.taskId
            ? { ...task, subtasks: action.payload.subtasks, showSubtasks: true }
            : task
        ),
        breakingDown: null,
      };
    case 'TOGGLE_SUBTASK':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload.taskId
            ? {
                ...task,
                subtasks: task.subtasks.map((st) =>
                  st.id === action.payload.subtaskId ? { ...st, completed: !st.completed } : st
                ),
              }
            : task
        ),
      };
    case 'TOGGLE_SUBTASKS_VISIBILITY':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload
            ? { ...task, showSubtasks: !task.showSubtasks }
            : task
        ),
      };
    case 'TOGGLE_SUGGESTIONS':
      return { ...state, suggestionsOpen: !state.suggestionsOpen };
    case 'SET_SUGGESTIONS':
      return { ...state, suggestions: action.payload, suggestionsLoading: false };
    case 'SET_SUGGESTIONS_LOADING':
      return { ...state, suggestionsLoading: action.payload };
    default:
      return state;
  }
}

export function KanbanProvider({ children }) {
  const [state, dispatch] = useReducer(kanbanReducer, initialState);

  const fetchTasks = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      dispatch({ type: 'SET_TASKS', payload: data });
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleTaskUpdate = useCallback(async (id, updates) => {
    try {
      const res = await fetch(API_URL + '/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const updated = await res.json();
      dispatch({ type: 'UPDATE_TASK', payload: updated });
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  }, []);

  const handleTaskDelete = useCallback(async (id) => {
    try {
      await fetch(API_URL + '/' + id, { method: 'DELETE' });
      dispatch({ type: 'DELETE_TASK', payload: id });
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  }, []);

  const handleTaskAdd = useCallback((task) => {
    dispatch({ type: 'ADD_TASK', payload: task });
  }, []);

  const handleDragEnd = useCallback(
    async (event) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id;
      const overId = over.id;
      const activeTask = state.tasks.find((t) => t.id === activeId);
      const overTask = state.tasks.find((t) => t.id === overId);

      if (!activeTask || !overTask) return;

      const activeColumn = activeTask.status;
      const overColumn = overTask.status;

      if (activeColumn === overColumn) {
        const columnTasks = state.tasks.filter((t) => t.status === activeColumn);
        const oldIndex = columnTasks.findIndex((t) => t.id === activeId);
        const newIndex = columnTasks.findIndex((t) => t.id === overId);

        const reordered = [...columnTasks];
        const [removed] = reordered.splice(oldIndex, 1);
        reordered.splice(newIndex, 0, removed);

        const updates = reordered.map((t, i) => ({ id: t.id, order: i }));
        dispatch({ type: 'REORDER_TASKS', payload: state.tasks.map((t) => {
          const update = updates.find((u) => u.id === t.id);
          return update ? { ...t, order: update.order } : t;
        }) });

        for (const update of updates) {
          await handleTaskUpdate(update.id, { order: update.order });
        }
      } else {
        dispatch({ type: 'UPDATE_TASK', payload: { ...activeTask, status: overColumn } });
        await handleTaskUpdate(activeId, { status: overColumn });
      }
    },
    [state.tasks, handleTaskUpdate]
  );

  const handleBreakdown = useCallback(async (task) => {
    dispatch({ type: 'SET_BREAKING_DOWN', payload: task.id });
    try {
      const result = await getTaskBreakdown(task.id, {
        title: task.title,
        description: task.description,
        priority: task.priority,
      });

      if (result.subtasks && result.subtasks.length > 0) {
        dispatch({
          type: 'ADD_SUBTASKS',
          payload: {
            taskId: task.id,
            subtasks: result.subtasks.map((subtask, i) => ({
              id: 'sub-' + task.id + '-' + i,
              title: typeof subtask === 'string' ? subtask : subtask.title,
              description: typeof subtask === 'string' ? '' : subtask.description || '',
              completed: false,
            })),
          },
        });
      }

      const aiTasks = result.standaloneTasks || result.aiTasks || [];
      if (aiTasks.length > 0) {
        for (const aiTask of aiTasks) {
          const newTask = await createTaskFromAI({
            title: aiTask.title || aiTask.text,
            description: aiTask.description || '',
            priority: aiTask.priority || 'medium',
            status: 'todo',
          });
          dispatch({ type: 'ADD_TASK', payload: newTask });
        }
      }
    } catch (err) {
      console.error('Failed to breakdown task:', err);
      dispatch({ type: 'SET_BREAKING_DOWN', payload: null });
    }
  }, []);

  const handleFetchSuggestions = useCallback(async () => {
    dispatch({ type: 'SET_SUGGESTIONS_LOADING', payload: true });
    try {
      const boardState = {
        columns: state.tasks.reduce((acc, task) => {
          acc[task.status] = (acc[task.status] || 0) + 1;
          return acc;
        }, {}),
        tasks: state.tasks.map((t) => ({ id: t.id, title: t.title, status: t.status, priority: t.priority })),
      };
      const result = await getWorkflowSuggestions(boardState);
      dispatch({
        type: 'SET_SUGGESTIONS',
        payload: Array.isArray(result) ? result : result.suggestions || [],
      });
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
      dispatch({ type: 'SET_SUGGESTIONS_LOADING', payload: false });
    }
  }, [state.tasks]);

  const toggleSuggestions = useCallback(() => {
    dispatch({ type: 'TOGGLE_SUGGESTIONS' });
    if (!state.suggestionsOpen) {
      handleFetchSuggestions();
    }
  }, [state.suggestionsOpen, handleFetchSuggestions]);

  const toggleSubtasksVisibility = useCallback((taskId) => {
    dispatch({ type: 'TOGGLE_SUBTASKS_VISIBILITY', payload: taskId });
  }, []);

  const toggleSubtask = useCallback((taskId, subtaskId) => {
    dispatch({ type: 'TOGGLE_SUBTASK', payload: { taskId, subtaskId } });
  }, []);

  const value = {
    tasks: state.tasks,
    loading: state.loading,
    breakingDown: state.breakingDown,
    suggestionsOpen: state.suggestionsOpen,
    suggestions: state.suggestions,
    suggestionsLoading: state.suggestionsLoading,
    handleTaskUpdate,
    handleTaskDelete,
    handleTaskAdd,
    handleDragEnd,
    handleBreakdown,
    toggleSuggestions,
    toggleSubtasksVisibility,
    toggleSubtask,
  };

  return <KanbanContext.Provider value={value}>{children}</KanbanContext.Provider>;
}

export function useKanban() {
  const context = useContext(KanbanContext);
  if (!context) {
    throw new Error('useKanban must be used within a KanbanProvider');
  }
  return context;
}
