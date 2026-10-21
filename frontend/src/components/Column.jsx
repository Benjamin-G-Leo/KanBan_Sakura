import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskCard } from './TaskCard';
import { AddTaskForm } from './AddTaskForm';

export function Column({ columnId, title, tasks, onTaskUpdate, onTaskDelete, onTaskAdd, isAiModeEnabled }) {
  const { setNodeRef } = useDroppable({ id: columnId });

  return (
    <div className={`kanban-column ${columnId} flex-1 min-w-[280px] max-w-[320px]`} data-stage={columnId}>
      <div className="column-header">
        <h3 className="column-title">
          {title}
          <span className="column-count">{tasks.length}</span>
          {isAiModeEnabled && (
            <span className="smart-sort-label ml-2 text-[10px] font-semibold uppercase tracking-[0.12em]">
              Smart Priority Sort
            </span>
          )}
        </h3>
      </div>
      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="cards-container">
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              id={task.id}
              task={task}
              onUpdate={onTaskUpdate}
              onDelete={onTaskDelete}
            />
          ))}
        </div>
      </SortableContext>
      {columnId === 'todo' && <AddTaskForm onAdd={onTaskAdd} />}
    </div>
  );
}

function SortableTaskCard({ id, task, onUpdate, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} onUpdate={onUpdate} onDelete={onDelete} />
    </div>
  );
}