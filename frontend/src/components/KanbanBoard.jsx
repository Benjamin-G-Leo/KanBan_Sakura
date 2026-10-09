import { useState, useEffect, useCallback } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Column } from './Column';
import { COLUMNS, API_URL } from './constants';

export function KanbanBoard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  const handleTaskUpdate = async (id, updates) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const updated = await res.json();
      setTasks((currentTasks) => currentTasks.map((task) => task.id === id ? updated : task));
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const handleTaskDelete = async (id) => {
    try {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      setTasks((currentTasks) => currentTasks.filter((task) => task.id !== id));
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleTaskAdd = (task) => {
    setTasks((currentTasks) => [...currentTasks, task]);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    const activeTask = tasks.find((task) => task.id === activeId);
    const overTask = tasks.find((task) => task.id === overId);

    if (!activeTask || !overTask) return;

    const activeColumn = activeTask.status;
    const overColumn = overTask.status;

    if (activeColumn === overColumn) {
      const columnTasks = tasks.filter((task) => task.status === activeColumn);
      const oldIndex = columnTasks.findIndex((task) => task.id === activeId);
      const newIndex = columnTasks.findIndex((task) => task.id === overId);
      const reordered = arrayMove(columnTasks, oldIndex, newIndex);

      setTasks((currentTasks) => {
        const nextTasks = currentTasks.map((task) => ({ ...task }));
        const columnTaskIds = new Set(reordered.map((task) => task.id));

        for (const [index, task] of reordered.entries()) {
          const target = nextTasks.find((currentTask) => currentTask.id === task.id);
          if (target) target.order = index;
        }

        return nextTasks.map((task) => {
          if (!columnTaskIds.has(task.id)) return task;
          const reorderedTask = reordered.find((item) => item.id === task.id);
          return reorderedTask ? { ...task, order: reordered.findIndex((item) => item.id === task.id) } : task;
        });
      });

      const updates = reordered.map((task, index) => ({ id: task.id, order: index }));
      for (const update of updates) {
        await handleTaskUpdate(update.id, { order: update.order });
      }
    } else {
      setTasks((currentTasks) => currentTasks.map((task) => task.id === activeId ? { ...task, status: overColumn } : task));
      await handleTaskUpdate(activeId, { status: overColumn });
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: () => ({ x: 0, y: 0 }),
    }),
  );

  if (loading) {
    return <div className="loading-spinner" />;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((column) => (
          <Column
            key={column.id}
            columnId={column.id}
            title={column.title}
            tasks={tasks.filter((task) => task.status === column.id)}
            onTaskUpdate={handleTaskUpdate}
            onTaskDelete={handleTaskDelete}
            onTaskAdd={handleTaskAdd}
          />
        ))}
      </div>
    </DndContext>
  );
}