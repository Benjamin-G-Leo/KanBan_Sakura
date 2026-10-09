import { useState } from 'react';

export function TaskCard({ task, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description || '');

  const handleSave = () => {
    onUpdate(task.id, { title: editTitle, description: editDesc });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(task.title);
    setEditDesc(task.description || '');
    setIsEditing(false);
  };

  const priorityClass = task.priority === 'high' ? 'high' : task.priority === 'low' ? 'low' : 'medium';
  const isAI = task.isAI || task.isAiGenerated;

  return (
    <div className={`glass-card task-card ${isAI ? 'is-ai-generated' : ''}`}>
      <div className="flex items-start gap-3">
        <div className={`task-priority-indicator ${priorityClass}`} />
        <div className="task-content flex-1 min-w-0">
          {isEditing ? (
            <form className="task-edit-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm"
                autoFocus
              />
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="w-full px-3 py-2 text-sm resize-none"
                rows={2}
              />
              <div className="form-actions">
                <button type="submit" className="save">Save</button>
                <button type="button" className="cancel" onClick={handleCancel}>Cancel</button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex items-start justify-between gap-2">
                <h4 className="task-title flex-1">{task.title}</h4>
                {isAI && <span className="ai-badge flex-shrink-0">AI</span>}
              </div>
              {task.description && <p className="task-description">{task.description}</p>}
              <div className="task-actions">
                <button
                  onClick={() => setIsEditing(true)}
                  className="task-action-btn"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(task.id)}
                  className="task-action-btn delete"
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}