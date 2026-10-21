import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Column } from './Column';
import { COLUMNS } from './constants';
import { useKanban } from '../context/useKanban';

export function KanbanBoard() {
  const {
    tasks,
    loading,
    handleTaskUpdate,
    handleTaskDelete,
    handleTaskAdd,
    handleDragEnd,
    isAiModeEnabled,
  } = useKanban();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
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
      <div className="flex gap-8 overflow-x-auto pb-4">
        {COLUMNS.map((column) => (
          <Column
            key={column.id}
            columnId={column.id}
            title={column.title}
            tasks={tasks.filter((task) => task.status === column.id)}
            onTaskUpdate={handleTaskUpdate}
            onTaskDelete={handleTaskDelete}
            onTaskAdd={handleTaskAdd}
            isAiModeEnabled={isAiModeEnabled}
          />
        ))}
      </div>
    </DndContext>
  );
}
