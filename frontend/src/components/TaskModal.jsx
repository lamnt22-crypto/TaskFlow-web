import React, { useState, useEffect } from 'react';
import BottomSheet from './BottomSheet';
import { triggerHaptic } from '../utils/haptics';
import { sounds } from '../utils/soundEffects';

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Subtask handlers
  const handleAddSubtask = () => {
    const trimmed = newSubtask.trim();
    if (trimmed) {
      triggerHaptic('light');
      sounds.playPop();
      setSubtasks([...subtasks, { title: trimmed, is_completed: false }]);
      setNewSubtask('');
    }
  };

  const handleToggleSubtask = (index) => {
    triggerHaptic('light');
    sounds.playPop();
    const updated = [...subtasks];
    updated[index].is_completed = !updated[index].is_completed;
    setSubtasks(updated);
  };

  const handleDeleteSubtask = (index) => {
    triggerHaptic('medium');
    const updated = subtasks.filter((_, i) => i !== index);
    setSubtasks(updated);
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const title = formData.title.trim();
    if (!title) {
      setError('Vui lòng nhập tiêu đề công việc');
      triggerHaptic('error');
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
      subtasks: subtasks.filter(s => s.title.trim() !== '')
    };

    try {
      triggerHaptic('success');
      sounds.playDrop();
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lưu công việc thất bại');
      triggerHaptic('error');
      setIsSubmitting(false);
    }
  };

  const isEdit = !!task;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Chỉnh Sửa Công Việc' : 'Tạo Công Việc Mới'}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded-2xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Tiêu đề *
          </label>
          <input 
            type="text" 
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Bạn cần hoàn thành điều gì?" 
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-900 dark:text-white placeholder-slate-400 font-medium transition-all"
            disabled={isSubmitting}
            autoFocus
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Mô tả chi tiết
          </label>
          <textarea 
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            placeholder="Ghi chú thêm thông tin..." 
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-900 dark:text-white placeholder-slate-400 font-medium transition-all resize-none"
            disabled={isSubmitting}
          />
        </div>

        {/* Subtasks */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Danh sách việc con ({subtasks.filter(s => s.is_completed).length}/{subtasks.length})
          </label>
          
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
              placeholder="Thêm bước con và bấm Enter..."
              className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-900 dark:text-white"
            />
            <button
              type="button"
              onClick={handleAddSubtask}
              className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Thêm
            </button>
          </div>

          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {subtasks.map((st, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={st.is_completed}
                    onChange={() => handleToggleSubtask(idx)}
                    className="w-4 h-4 rounded-md text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className={`text-xs font-medium ${st.is_completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                    {st.title}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => handleDeleteSubtask(idx)}
                  className="text-slate-400 hover:text-rose-500 p-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Category, Due Date, Status, Priority 2x2 Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Category */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Danh mục
              </label>
              {onManageCategories && (
                <button 
                  type="button" 
                  onClick={() => {
                    triggerHaptic('light');
                    onManageCategories();
                  }}
                  className="text-[11px] text-indigo-500 hover:underline font-semibold"
                >
                  + Quản lý
                </button>
              )}
            </div>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            >
              <option value="">Không phân loại</option>
              {categories && categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Hạn hoàn thành
            </label>
            <input 
              type="date"
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Trạng thái
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            >
              <option value="TODO">Cần làm</option>
              <option value="IN_PROGRESS">Đang tiến hành</option>
              <option value="COMPLETED">Đã hoàn thành</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Mức độ ưu tiên
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            >
              <option value="LOW">Thấp</option>
              <option value="MEDIUM">Vừa</option>
              <option value="HIGH">Cao</option>
              <option value="URGENT">Khẩn cấp</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-white/10">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-extrabold shadow-md shadow-indigo-500/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
          >
            {isSubmitting ? (
              <span>Đang lưu...</span>
            ) : (
              <span>{isEdit ? 'Lưu Thay Đổi' : 'Tạo Công Việc'}</span>
            )}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};

export default TaskModal;
