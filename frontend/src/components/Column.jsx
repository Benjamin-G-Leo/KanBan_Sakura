import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskCard } from './TaskCard';
import { AddTaskForm } from './AddTaskForm';
import { COLUMNS } from './constants';

export function Column({ columnId, title, tasks, onTaskUpdate, onTaskDelete }) {
  const columnConfig = COLUMNS.find(c => c.id === columnId);

  return (
    <div className={`flex-1 min-w-[280px] max-w-[320px] ${columnConfig?.color || 'bg-gray-100'} rounded-xl p-3`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wider">
          {title} <span className="text-gray-500 dark:text-gray-400 font-normal">({tasks.length})</span>
        </h3>
      </div>
      <div className="space-y-2 min-h-[200px]">
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
      <AddTaskForm columnId={columnId} onAdd={() => {}} />
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