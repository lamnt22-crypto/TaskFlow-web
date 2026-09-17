import React, { useState, useEffect } from 'react';

const TaskModal = ({ isOpen, onClose, task, categories, onSave, onManageCategories }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    status: 'TODO',
    priority: 'MEDIUM',
    due_date: ''
  });
  
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtask, setNewSubtask] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (task) {
        setFormData({
          title: task.title || '',
          description: task.description || '',
          category_id: task.category_id || '',
          status: task.status || 'TODO',
          priority: task.priority || 'MEDIUM',
          due_date: task.due_date ? task.due_date.split('T')[0] : ''
        });
        setSubtasks(task.subtasks ? JSON.parse(JSON.stringify(task.subtasks)) : []);
      } else {
        setFormData({
          title: '',
          description: '',
          category_id: '',
          status: 'TODO',
          priority: 'MEDIUM',
          due_date: ''
        });
        setSubtasks([]);
      }
      setNewSubtask('');
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, task]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Subtask handlers
  const handleAddSubtask = () => {
    const trimmed = newSubtask.trim();
    if (trimmed) {
      setSubtasks([...subtasks, { title: trimmed, is_completed: false }]);
      setNewSubtask('');
    }
  };

  const toggleSubtask = (index) => {
    const updated = [...subtasks];
    updated[index].is_completed = !updated[index].is_completed;
    setSubtasks(updated);
  };

  const editSubtask = (index, newTitle) => {
    const updated = [...subtasks];
    updated[index].title = newTitle;
    setSubtasks(updated);
  };

  const removeSubtask = (index) => {
    const updated = [...subtasks];
    updated.splice(index, 1);
    setSubtasks(updated);
  };

  const completedCount = subtasks.filter(s => s.is_completed).length;
  const progressPercent = subtasks.length > 0 ? Math.round((completedCount / subtasks.length) * 100) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const title = formData.title.trim();
    if (!title) {
      setError('Title is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload = {
      title,
      description: formData.description.trim() || null,
      categoryId: formData.category_id ? parseInt(formData.category_id, 10) : null,
      status: formData.status,
      priority: formData.priority,
      dueDate: formData.due_date ? new Date(formData.due_date).toISOString() : null,
      subtasks: subtasks.filter(s => s.title.trim() !== '') // Filter empty titles
    };

    try {
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save task');
      setIsSubmitting(false);
    }
  };

  const isEdit = !!task;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-slate-900/80 backdrop-blur-sm transition-all">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{isEdit ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex flex-col flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium border border-red-100 dark:border-red-800/50">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title *</label>
              <input 
                type="text" 
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="What needs to be done?" 
                className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400"
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3" 
                placeholder="Add details..."
                className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400 resize-none"
                disabled={isSubmitting}
              />
            </div>

            {/* Subtasks Section */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Checklist</label>
                {subtasks.length > 0 && (
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    {completedCount}/{subtasks.length} ({progressPercent}%)
                  </span>
                )}
              </div>
              
              {subtasks.length > 0 && (
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full mb-4 overflow-hidden flex">
                  <div 
                    className={`h-full transition-all duration-500 ${progressPercent === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              )}

              <div className="flex gap-2 mb-3">
                <input 
                  type="text"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                  placeholder="Add an item..."
                  className="flex-1 px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 text-slate-900 dark:text-slate-100 placeholder-slate-400"
                />
                <button type="button" onClick={handleAddSubtask} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg transition-colors">Add</button>
              </div>

              {subtasks.length > 0 && (
                <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                  {subtasks.map((st, i) => (
                    <div key={st.id || i} className="flex items-start gap-3 group bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 p-1.5 -mx-1.5 rounded-lg transition-colors">
                      <input 
                        type="checkbox" 
                        checked={st.is_completed}
                        onChange={() => toggleSubtask(i)}
                        className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800 focus:ring-blue-500 cursor-pointer shrink-0"
                      />
                      <input 
                        type="text"
                        value={st.title}
                        onChange={(e) => editSubtask(i, e.target.value)}
                        className={`flex-1 text-sm bg-transparent border-none focus:ring-0 p-0 ${st.is_completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200'}`}
                      />
                      <button type="button" onClick={() => removeSubtask(i)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-0.5 rounded transition-all shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                <div className="flex items-center gap-2">
                  <select 
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all text-slate-900 dark:text-slate-100"
                    disabled={isSubmitting}
                  >
                    <option value="">No Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {onManageCategories && (
                    <button 
                      type="button" 
                      onClick={onManageCategories}
                      className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 flex items-center justify-center"
                      title="Manage Categories"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Due Date</label>
                <input 
                  type="date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all text-slate-900 dark:text-slate-100"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                <select 
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all text-slate-900 dark:text-slate-100"
                  disabled={isSubmitting}
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                <select 
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all text-slate-900 dark:text-slate-100"
                  disabled={isSubmitting}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 shrink-0">
          <button 
            type="button" 
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            type="button" // Change to type button and use onClick to trigger submit to avoid Enter key submitting form when adding subtask
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[5rem]"
          >
            {isSubmitting ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Task')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
