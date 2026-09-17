import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generatePlanFromFile } from '../services/aiService';
import { createTask } from '../services/taskService';
import toast from 'react-hot-toast';

const AIFilePlannerModal = ({ isOpen, onClose, onPlanCreated }) => {
  const [step, setStep] = useState(1); // 1: Input, 2: Loading, 3: Preview
  const [formData, setFormData] = useState({
    goal: '',
    audience: '',
    durationDays: 7
  });
  const [file, setFile] = useState(null);
  
  const [plan, setPlan] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Vui lòng tải lên một tài liệu tham khảo.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File quá lớn. Vui lòng chọn file dưới 5MB.');
      return;
    }
    
    setStep(2);
    try {
      const form = new FormData();
      form.append('file', file);
      if (formData.goal) form.append('goal', formData.goal);
      if (formData.audience) form.append('audience', formData.audience);
      form.append('durationDays', formData.durationDays);

      const response = await generatePlanFromFile(form);
      
      if (!response.success) {
        throw new Error(response.error);
      }
      
      const planArray = Array.isArray(response.data) ? response.data : [];
      setPlan(planArray);
      setSelectedTasks(planArray.map((_, idx) => idx));
      setStep(3);
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Có lỗi xảy ra khi tạo kế hoạch.');
      setStep(1);
    }
  };

  const toggleTaskSelection = (idx) => {
    if (selectedTasks.includes(idx)) {
      setSelectedTasks(selectedTasks.filter(i => i !== idx));
    } else {
      setSelectedTasks([...selectedTasks, idx]);
    }
  };

  const handleSaveToCalendar = async () => {
    if (selectedTasks.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 công việc.');
      return;
    }

    setIsSaving(true);
    let successCount = 0;
    
    try {
      const tasksToCreate = selectedTasks.map(idx => plan[idx]);
      
      for (const t of tasksToCreate) {
        // Calculate due date
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (t.day_offset || 1));
        
        const payload = {
          title: t.title,
          description: t.description || `Task từ kế hoạch: ${formData.goal}`,
          priority: t.priority || 'MEDIUM',
          status: 'TODO',
          dueDate: dueDate.toISOString()
        };
        
        await createTask(payload);
        successCount++;
      }
      
      toast.success(`Đã thêm ${successCount} công việc vào lịch!`, { icon: '📅' });
      if (onPlanCreated) onPlanCreated();
      onClose();
      // Reset state for next time
      setTimeout(() => setStep(1), 500);
    } catch (error) {
      console.error(error);
      toast.error('Có lỗi xảy ra khi lưu kế hoạch.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 dark:bg-slate-900/80 backdrop-blur-sm transition-all">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <span className="text-xl">📄</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">AI Document Planner</h2>
              <p className="text-indigo-100 text-xs">Phân tích tài liệu và lên lịch trình</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex flex-col flex-1 overflow-y-auto">
          
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-8 space-y-6"
              >
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Tài liệu tham khảo (PDF, Word, Excel) *</label>
                  <div className={`border-2 border-dashed rounded-xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer relative ${file ? 'border-indigo-400 bg-indigo-50/30' : 'border-slate-300 dark:border-slate-700'}`}>
                    <input 
                      type="file" 
                      onChange={(e) => setFile(e.target.files[0])}
                      accept=".pdf,.doc,.docx,.xls,.xlsx"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {file ? (
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-4xl">📄</span>
                        <span className="text-sm font-bold text-indigo-600">{file.name}</span>
                        <span className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-4xl opacity-50">📁</span>
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Kéo thả hoặc click để tải lên file</span>
                        <span className="text-xs text-slate-400">Hỗ trợ: PDF, DOCX, XLSX (Max 5MB)</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Mục tiêu bổ sung (Tùy chọn)</label>
                  <input 
                    type="text" 
                    name="goal"
                    value={formData.goal}
                    onChange={handleChange}
                    placeholder="Để trống nếu muốn AI tự xác định mục tiêu từ tài liệu..." 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-slate-100"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Đối tượng mục tiêu</label>
                    <input 
                      type="text" 
                      name="audience"
                      value={formData.audience}
                      onChange={handleChange}
                      placeholder="VD: Gen Z, Khách hàng mới..." 
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Khung thời gian (Ngày)</label>
                    <input 
                      type="number" 
                      name="durationDays"
                      min="1"
                      max="365"
                      value={formData.durationDays}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
                
                <button 
                  onClick={handleGenerate}
                  disabled={!file}
                  className="w-full py-3.5 mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all flex justify-center items-center gap-2"
                >
                  <span>✨</span> Bắt đầu tạo kế hoạch
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-12 flex flex-col items-center justify-center text-center space-y-6 my-auto"
              >
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 border-4 border-indigo-100 dark:border-indigo-900 rounded-full" />
                  <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-3xl animate-pulse">✨</div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Đang phân tích và lên lịch trình...</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">AI đang cá nhân hóa kế hoạch cho mục tiêu của bạn. Có thể mất vài giây.</p>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-0"
              >
                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200">Lộ trình được đề xuất</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Chọn các công việc bạn muốn đưa vào lịch.</p>
                  </div>
                  <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg">
                    Đã chọn {selectedTasks.length}/{plan.length}
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  {plan.map((task, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => toggleTaskSelection(idx)}
                      className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all flex gap-4 ${
                        selectedTasks.includes(idx) 
                          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20' 
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300'
                      }`}
                    >
                      <div className="pt-1">
                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                          selectedTasks.includes(idx)
                            ? 'bg-indigo-500 border-indigo-500 text-white'
                            : 'border-slate-300 dark:border-slate-600 bg-transparent'
                        }`}>
                          {selectedTasks.includes(idx) && <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h4 className="font-bold text-slate-800 dark:text-slate-200 leading-snug">{task.title}</h4>
                          <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            Ngày {task.day_offset}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                          {task.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky bottom-0 flex justify-between gap-4">
                  <button 
                    onClick={() => setStep(1)}
                    disabled={isSaving}
                    className="px-6 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    Quay lại
                  </button>
                  <button 
                    onClick={handleSaveToCalendar}
                    disabled={isSaving || selectedTasks.length === 0}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-bold py-2.5 rounded-xl shadow-md transition-all flex justify-center items-center gap-2"
                  >
                    {isSaving ? 'Đang lưu...' : 'Thêm vào Lịch'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
        </div>
      </div>
    </div>
  );
};

export default AIFilePlannerModal;
