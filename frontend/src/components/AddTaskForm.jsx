import { useState } from 'react';
import { API_URL } from './constants';

export function AddTaskForm({ onAdd }) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, status: 'todo', priority }),
      });
      const task = await res.json();
      onAdd(task);
      setTitle('');
      setDescription('');
      setPriority('medium');
      setShowForm(false);
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="add-task-trigger"
      >
        + Add Task
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="add-task-form">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title"
        autoFocus
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        rows={2}
      />
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
      >
        <option value="low">Low Priority</option>
        <option value="medium">Medium Priority</option>
        <option value="high">High Priority</option>
      </select>
      <div className="form-actions">
        <button type="submit">Add</button>
        <button type="button" onClick={() => { setShowForm(false); setTitle(''); setDescription(''); }}>Cancel</button>
      </div>
    </form>
  );
}