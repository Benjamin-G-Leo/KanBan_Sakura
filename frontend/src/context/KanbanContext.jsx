import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { API_URL, COLUMNS } from '../components/constants';
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
      const orderedTasks = data
        .map((task, index) => ({ task, index }))
        .sort((left, right) => {
          const leftColumn = COLUMNS.findIndex((column) => column.id === left.task.status);
          const rightColumn = COLUMNS.findIndex((column) => column.id === right.task.status);
          if (leftColumn !== rightColumn) return leftColumn - rightColumn;
          return (left.task.order ?? Infinity) - (right.task.order ?? Infinity)
            || left.index - right.index;
        })
        .map(({ task }) => task);
      dispatch({ type: 'SET_TASKS', payload: orderedTasks });
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

      if (!activeTask) return;
      const overColumn = overTask?.status ?? COLUMNS.find((column) => column.id === overId)?.id;
      if (!overColumn) return;
      const activeColumn = activeTask.status;

      if (activeColumn === overColumn) {
        if (!overTask || activeId === overId) return;

        const columnTasks = state.tasks.filter((t) => t.status === activeColumn);
        const oldIndex = columnTasks.findIndex((t) => t.id === activeId);
        const newIndex = columnTasks.findIndex((t) => t.id === overId);

        const reordered = [...columnTasks];
        const [removed] = reordered.splice(oldIndex, 1);
        reordered.splice(newIndex, 0, removed);

        const updates = reordered.map((t, i) => ({ id: t.id, order: i }));
        let index = 0;
        dispatch({
          type: 'REORDER_TASKS',
          payload: state.tasks.map((task) => (
            task.status === activeColumn
              ? { ...reordered[index], order: index++ }
              : task
          )),
        });

        await Promise.all(updates.map((update) => handleTaskUpdate(update.id, { order: update.order })));
      } else {
        const sourceTasks = state.tasks.filter((task) => task.status === activeColumn && task.id !== activeId);
        const destinationTasks = state.tasks.filter((task) => task.status === overColumn && task.id !== activeId);
        const insertAt = overTask
          ? destinationTasks.findIndex((task) => task.id === overId)
          : destinationTasks.length;
        destinationTasks.splice(insertAt < 0 ? destinationTasks.length : insertAt, 0, {
          ...activeTask,
          status: overColumn,
        });

        const updates = [
          ...sourceTasks.map((task, order) => ({ id: task.id, order })),
          ...destinationTasks.map((task, order) => ({
            id: task.id,
            order,
            ...(task.id === activeId ? { status: overColumn } : {}),
          })),
        ];
        const orderedById = new Map(updates.map((update) => [update.id, update]));
        const nextTasks = state.tasks
          .filter((task) => task.id !== activeId)
          .map((task) => {
            const update = orderedById.get(task.id);
            return update ? { ...task, order: update.order } : task;
          });
        const insertionIndex = overTask
          ? nextTasks.findIndex((task) => task.id === overId)
          : nextTasks.length;
        nextTasks.splice(insertionIndex < 0 ? nextTasks.length : insertionIndex, 0, {
          ...activeTask,
          status: overColumn,
          order: destinationTasks.findIndex((task) => task.id === activeId),
        });

        dispatch({ type: 'REORDER_TASKS', payload: nextTasks });
        await Promise.all(updates.map(({ id, order, status }) => (
          handleTaskUpdate(id, { order, ...(status ? { status } : {}) })
        )));
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
