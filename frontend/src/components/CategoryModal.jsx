import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/categoryService';
import { toast } from 'react-hot-toast';

const CategoryModal = ({ isOpen, onClose }) => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form states
  const [name, setName] = useState('');
  const [color, setColor] = useState('#4f46e5'); // Default indigo

  const presetColors = [
    '#4f46e5', // indigo
    '#0ea5e9', // sky
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#ec4899', // pink
    '#8b5cf6', // violet
    '#64748b'  // slate
  ];

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const data = await getCategories();
      if (data.success && data.data) {
        setCategories(data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setName('');
    setColor('#4f46e5');
    setEditingId(null);
  };

  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setName(cat.name);
    setColor(cat.color || '#4f46e5');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      if (editingId) {
        await updateCategory(editingId, { name, color });
        toast.success('Category updated successfully');
      } else {
        await createCategory({ name, color });
        toast.success('Category created successfully');
      }
      resetForm();
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category? All tasks in it will lose their category.')) {
      try {
        await deleteCategory(id);
        toast.success('Category deleted');
        fetchCategories();
      } catch (err) {
        toast.error('Failed to delete category');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 border border-slate-200 dark:border-slate-700 flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
              Manage Categories
            </h2>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Form */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800 shrink-0">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  {editingId ? 'Edit Category' : 'New Category'}
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="E.g., Work, Study, Health..."
                    className="flex-1 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-sm text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400 focus:border-slate-900 dark:focus:border-slate-400 transition-all outline-none"
                    required
                  />
                  <button type="submit" className="px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white rounded-md text-sm font-medium transition-colors flex-shrink-0">
                    {editingId ? 'Save Changes' : 'Add Category'}
                  </button>
                  {editingId && (
                    <button type="button" onClick={resetForm} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-md text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex-shrink-0">
                      Cancel
                    </button>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Color Label</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {presetColors.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded border border-black/10 dark:border-white/10 shadow-sm transition-transform ${color === c ? 'scale-110 ring-2 ring-offset-1 ring-offset-white dark:ring-offset-slate-800 ring-slate-400' : 'hover:scale-110'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-2"></div>
                  <div className="flex items-center gap-2 border border-slate-300 dark:border-slate-700 rounded-md p-1 bg-white dark:bg-slate-900">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-6 h-6 p-0 border-0 rounded cursor-pointer"
                    />
                    <span className="text-xs text-slate-500 uppercase px-1">{color}</span>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* List */}
          <div className="p-4 overflow-y-auto flex-1 bg-slate-50 dark:bg-slate-900/50">
            {isLoading ? (
               <div className="flex justify-center p-6"><svg className="animate-spin h-6 w-6 text-indigo-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>
            ) : categories.length === 0 ? (
               <div className="text-center p-6 text-slate-500 text-sm">No categories found. Create one above!</div>
            ) : (
              <ul className="flex flex-col gap-2">
                {categories.map(cat => (
                  <li key={cat.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-lg flex items-center justify-between group hover:border-slate-300 dark:hover:border-slate-600 transition-all">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: cat.color || '#4f46e5' }}></span>
                      <span className="font-medium text-sm text-slate-700 dark:text-slate-300">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(cat)} className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-md transition-colors" title="Edit">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-md transition-colors" title="Delete">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CategoryModal;
