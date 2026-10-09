import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskCard } from './TaskCard';
import { AddTaskForm } from './AddTaskForm';

export function Column({ columnId, title, tasks, onTaskUpdate, onTaskDelete, onTaskAdd }) {
  return (
    <div className={`kanban-column ${columnId} flex-1 min-w-[280px] max-w-[320px] flex flex-col`}>
      <div className="column-header">
        <h3 className="column-title">
          {title}
          <span className="column-count">{tasks.length}</span>
        </h3>
      </div>
      <div className="task-list flex-1 space-y-2 min-h-[200px] overflow-y-auto">
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
      <AddTaskForm columnId={columnId} onAdd={onTaskAdd} />
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