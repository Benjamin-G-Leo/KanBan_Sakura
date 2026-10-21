import { useState } from 'react';
import { useKanban } from '../context/useKanban';
import { getAdjacentStage } from './constants';

const PRIORITY_LABELS = { high: 'High', medium: 'Med', low: 'Low' };

export function TaskCard({ task, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description || '');
  const {
    handleBreakdown,
    breakingDown,
    toggleSubtasksVisibility,
    toggleSubtask,
    isAiModeEnabled,
    moveTask,
  } = useKanban();
  const previousStage = getAdjacentStage(task.status, -1);
  const nextStage = getAdjacentStage(task.status, 1);

  const handleSave = () => {
    onUpdate(task.id, { title: editTitle, description: editDesc });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(task.title);
    setEditDesc(task.description || '');
    setIsEditing(false);
  };

  const isBreakingDown = breakingDown === task.id;
  const hasSubtasks = isAiModeEnabled && task.subtasks && task.subtasks.length > 0;
  const showSubtasks = task.showSubtasks && hasSubtasks;
  const priorityClass = task.priority === 'high' ? 'high' : task.priority === 'low' ? 'low' : 'medium';
  const priorityLabel = PRIORITY_LABELS[priorityClass];
  const isAI = task.isAI || task.isAiGenerated;

  const completedSubtasks = hasSubtasks ? task.subtasks.filter(st => st.completed).length : 0;

  return (
    <div
      className={'glass-card task-card ' + (isAI ? 'is-ai-generated ' : '') + (isBreakingDown ? 'breaking-down' : '')}
      data-stage={task.status}
    >
      <div className='flex items-start gap-3'>
        <div className='task-stage-indicator' />
        <div className='task-content flex-1 min-w-0'>
          {isEditing ? (
            <form className='task-edit-form' onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <input
                type='text'
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className='w-full px-3 py-2 text-sm'
                autoFocus
              />
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className='w-full px-3 py-2 text-sm resize-none'
                rows={2}
              />
              <div className='form-actions'>
                <button type='submit' className='save'>Save</button>
                <button type='button' className='cancel' onClick={handleCancel}>Cancel</button>
              </div>
            </form>
          ) : (
            <>
              <div className='flex items-start justify-between gap-2'>
                <h4 className='task-title flex-1'>{task.title}</h4>
                <div className='flex items-center gap-2 flex-shrink-0'>
                  <span className={'priority-pill ' + priorityClass} title={priorityLabel + ' priority'}>{priorityLabel}</span>
                  {isAiModeEnabled && isAI && <span className='ai-badge flex-shrink-0'>AI</span>}
                  {hasSubtasks && (
                    <span className='subtask-count' style={{
                      fontSize: '0.625rem',
                      color: 'var(--text-muted)',
                      background: 'var(--glass-bg-column)',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '9999px',
                      border: '1px solid var(--glass-border-card)'
                    }}>
                      {completedSubtasks}/{task.subtasks.length}
                    </span>
                  )}
                </div>
              </div>
              {task.description && (
                <div className='task-description-layer'>
                  <p className='task-description font-normal antialiased subpixel-antialiased transform translate-z-0'>
                    {task.description}
                  </p>
                </div>
              )}
              
              {hasSubtasks && (
                <div className='subtasks-container' style={{ marginTop: 'var(--space-sm)' }}>
                  <button
                    onClick={() => toggleSubtasksVisibility(task.id)}
                    className='subtasks-toggle'
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-sm)',
                      padding: 'var(--space-xs) var(--space-sm)',
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-sm)',
                      transition: 'color var(--transition-fast), background var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => { e.target.style.color = 'var(--text-primary)'; e.target.style.background = 'var(--glass-bg-column)'; }}
                    onMouseLeave={(e) => { e.target.style.color = 'var(--text-secondary)'; e.target.style.background = 'transparent'; }}
                  >
                    <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' style={{ transform: showSubtasks ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform var(--transition-fast)' }}>
                      <polyline points='6 9 12 15 18 9' />
                    </svg>
                    {showSubtasks ? 'Hide' : 'Show'} Subtasks ({completedSubtasks}/{task.subtasks.length})
                  </button>
                  
                  {showSubtasks && (
                    <ul className='subtasks-list' style={{ 
                      marginTop: 'var(--space-sm)', 
                      paddingLeft: 'var(--space-lg)',
                      borderLeft: '1px solid var(--glass-border-card)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-xs)'
                    }}>
                      {task.subtasks.map((subtask) => (
                        <li key={subtask.id} className='subtask-item' style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 'var(--space-sm)',
                          padding: 'var(--space-xs) var(--space-sm)',
                          background: 'var(--glass-bg-column)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--glass-border-card)',
                          transition: 'background var(--transition-fast), border-color var(--transition-fast)',
                        }}>
                          <input
                            type='checkbox'
                            checked={subtask.completed}
                            onChange={() => toggleSubtask(task.id, subtask.id)}
                            style={{
                              width: '1rem',
                              height: '1rem',
                              accentColor: 'var(--priority-medium)',
                              cursor: 'pointer',
                              flexShrink: 0,
                            }}
                          />
                          <span style={{
                            flex: 1,
                            fontSize: '0.8125rem',
                            color: subtask.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                            textDecoration: subtask.completed ? 'line-through' : 'none',
                            transition: 'color var(--transition-fast)',
                          }}>
                            {subtask.title}
                          </span>
                          {subtask.description && (
                            <span style={{
                              fontSize: '0.6875rem',
                              color: 'var(--text-muted)',
                              maxWidth: '200px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}>
                              {subtask.description}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              
              <div className='task-actions'>
                <button
                  onClick={() => setIsEditing(true)}
                  className='task-action-btn edit'
                >
                  Edit
                </button>
                {isAiModeEnabled && (
                  <button
                    onClick={() => handleBreakdown(task)}
                    disabled={isBreakingDown}
                    className='task-action-btn breakdown-btn'
                    style={{
                      color: 'var(--priority-medium)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-xs)',
                      fontWeight: '500',
                    }}
                  >
                    {isBreakingDown ? (
                      <>
                        <span className='breakdown-spinner' style={{
                          width: '12px',
                          height: '12px',
                          border: '2px solid var(--glass-border-column)',
                          borderTopColor: 'var(--priority-medium)',
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite',
                        }} />
                        Processing...
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize: '0.875rem' }}>✦</span>
                        Breakdown
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={() => onDelete(task.id)}
                  className='task-action-btn delete'
                >
                  Delete
                </button>
                <div className='stage-moves'>
                  {previousStage && (
                    <button
                      onClick={() => moveTask(task, -1)}
                      className='task-action-btn stage-move'
                      aria-label={'Move back to ' + previousStage.title}
                      title={'Move back to ' + previousStage.title}
                    >
                      ←
                    </button>
                  )}
                  {nextStage && (
                    <button
                      onClick={() => moveTask(task, 1)}
                      className='task-action-btn stage-move'
                      data-stage={nextStage.id}
                      aria-label={'Move to ' + nextStage.title}
                      title={'Move to ' + nextStage.title}
                    >
                      {nextStage.title} →
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {isBreakingDown && (
        <div className='breakdown-overlay' style={{
          position: 'absolute',
          inset: 0,
          background: 'var(--ai-shimmer)',
          backgroundSize: '200% 100%',
          borderRadius: 'inherit',
          opacity: 0.3,
          animation: 'ai-shimmer 1.5s linear infinite',
          pointerEvents: 'none',
          zIndex: 1,
        }} />
      )}
    </div>
  );
}
