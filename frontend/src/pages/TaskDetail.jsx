import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getTaskById, updateTask, deleteTask } from '../services/taskService';
import { getCategories } from '../services/categoryService';
import { summarizeTask } from '../services/aiService';
import TaskModal from '../components/TaskModal';
import DeleteModal from '../components/DeleteModal';
import SubtaskList from '../components/SubtaskList';
import { useTranslation } from 'react-i18next';
import { useGamification } from '../context/GamificationContext';
import toast from 'react-hot-toast';

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { triggerConfetti, fetchStreaks, playTingSound } = useGamification();
  
  const [task, setTask] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [summary, setSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchTaskDetails = async () => {
    try {
      const [taskRes, catRes] = await Promise.all([
        getTaskById(id),
        getCategories()
      ]);
      setCategories(catRes.data);
      
      const enrichedTask = {
        ...taskRes.data,
        category: catRes.data.find(c => c.id === taskRes.data.category_id) || null
      };
      setTask(enrichedTask);
    } catch (err) {
      console.error(err);
      setError('Task not found or you do not have permission to view it.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      const response = await updateTask(task.id, { status: newStatus });
      if (response?.data?.gamification || response?.gamification) {
        const gamification = response.data?.gamification || response.gamification;
        playTingSound();
        triggerConfetti(gamification.allCompleted ? 'massive' : 'small');
        fetchStreaks();
        
        if (gamification.allCompleted) {
           toast.success('🎉 Tuyệt vời! Bạn đã hoàn thành TẤT CẢ công việc hôm nay!', { duration: 4000, icon: '🌟' });
        } else {
           toast.success(`🔥 Chuỗi năng suất: ${gamification.currentStreak} ngày liên tiếp!`, { icon: '🔥' });
        }
      }
      fetchTaskDetails();
    } catch (err) {
      console.error('Failed to change status');
    }
  };

  const handleSaveEdit = async (taskData) => {
    const response = await updateTask(task.id, taskData);
    if (response?.data?.gamification || response?.gamification) {
      const gamification = response.data?.gamification || response.gamification;
      playTingSound();
      triggerConfetti(gamification.allCompleted ? 'massive' : 'small');
      fetchStreaks();
      
      if (gamification.allCompleted) {
         toast.success('🎉 Tuyệt vời! Bạn đã hoàn thành TẤT CẢ công việc hôm nay!', { duration: 4000, icon: '🌟' });
      } else {
         toast.success(`🔥 Chuỗi năng suất: ${gamification.currentStreak} ngày liên tiếp!`, { icon: '🔥' });
      }
    }
    setIsEditModalOpen(false);
    fetchTaskDetails();
  };

  const handleDeleteConfirm = async () => {
    await deleteTask(task.id);
    setIsDeleteModalOpen(false);
    navigate('/my-tasks');
  };

  const handleSummarize = async () => {
    if (!task.description) return;
    setIsSummarizing(true);
    try {
      const result = await summarizeTask(task.id);
      setSummary(result.summary);
      toast.success('Đã tạo tóm tắt thành công!', { icon: '✨' });
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi xảy ra khi tóm tắt công việc.');
    } finally {
      setIsSummarizing(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (error || !task) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Task Not Found</h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <Link to="/my-tasks" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Go to My Tasks</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto flex flex-col h-full">
        
        {/* Top Breadcrumb & Action Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link to="/my-tasks" className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Back to My Tasks
            </Link>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1.5 text-sm font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
              Active Task
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={() => setIsDeleteModalOpen(true)} className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Delete Task
            </button>
            {task.status !== 'COMPLETED' && (
              <button onClick={() => handleStatusChange('COMPLETED')} className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Mark as Completed
              </button>
            )}
            <button onClick={() => setIsEditModalOpen(true)} className="flex items-center gap-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-lg shadow-sm transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              Edit Task
            </button>
          </div>
        </div>

        {/* Content Layout */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* Main Content (Left) */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-8 w-full">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-md uppercase tracking-wider">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span> {task.status.replace('_', ' ')}
              </span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md uppercase tracking-wider">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
                {task.priority} PRIORITY
              </span>
              {task.category && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: task.category.color }}></span> {task.category.name}
                </span>
              )}
              
              {task.due_date && (
                <div className={`ml-auto flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-lg border ${new Date(task.due_date) < new Date() && task.status !== 'COMPLETED' ? 'text-red-600 bg-red-50 border-red-200' : 'text-slate-600 bg-slate-50 border-slate-200'}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Due {new Date(task.due_date).toLocaleDateString()}
                </div>
              )}
            </div>

            <h1 className="text-3xl font-extrabold text-slate-900 mb-8 leading-tight">{task.title}</h1>
            
            <div className="mb-4 flex items-center justify-between">
               <div className="flex items-center gap-4">
                 <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                   <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
                   Description
                 </h3>
                 {task.description && task.description.length > 50 && (
                   <button 
                     onClick={handleSummarize}
                     disabled={isSummarizing}
                     className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold transition-colors disabled:opacity-50"
                   >
                     {isSummarizing ? (
                       <span className="flex items-center gap-1">
                         <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" /> Tóm tắt...
                       </span>
                     ) : (
                       <>
                         <span>✨</span> Tóm tắt AI
                       </>
                     )}
                   </button>
                 )}
               </div>
               <span className="text-xs font-medium text-slate-400">Plaintext format</span>
            </div>
            
            {summary && (
              <div className="mb-4 bg-indigo-50/50 border border-indigo-100 rounded-xl p-5">
                <h4 className="flex items-center gap-2 text-sm font-bold text-indigo-900 mb-3">
                  <span>✨</span> AI Summary
                </h4>
                <div className="text-indigo-800 text-sm leading-relaxed whitespace-pre-wrap">
                  {summary}
                </div>
              </div>
            )}
            
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 text-slate-700 leading-relaxed whitespace-pre-wrap text-[15px]">
              {task.description || <span className="italic text-slate-400">No description provided.</span>}
            </div>

            <SubtaskList 
              taskId={task.id} 
              taskTitle={task.title} 
              taskDescription={task.description} 
              initialSubtasks={task.subtasks || []} 
            />
          </div>

          {/* Properties Panel (Right) */}
          <div className="w-full lg:w-80 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden shrink-0">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                Task Properties
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Metadata</span>
            </div>
            
            <div className="p-6 flex flex-col gap-5">
              <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                <span className="text-sm text-slate-500 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Status
                </span>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded uppercase flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span> {task.status.replace('_', ' ')}</span>
              </div>
              
              <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                <span className="text-sm text-slate-500 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
                  Priority
                </span>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded uppercase">{task.priority}</span>
              </div>
              
              <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                <span className="text-sm text-slate-500 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                  Category
                </span>
                <span className="text-xs font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: task.category?.color || '#cbd5e1' }}></span> {task.category?.name || 'None'}</span>
              </div>
              
              <div className="flex justify-between items-start pb-3 border-b border-slate-50">
                <span className="text-sm text-slate-500 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Due Date
                </span>
                <div className="text-right text-sm font-semibold text-slate-900">
                  {task.due_date ? (
                    <>
                      <div>{new Date(task.due_date).toLocaleDateString()}</div>
                      <div className="text-[10px] font-medium text-slate-400 uppercase mt-0.5">{new Date(task.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </>
                  ) : <span className="text-slate-400 italic">None</span>}
                </div>
              </div>
              
              <div className="flex justify-between items-start pb-3 border-b border-slate-50">
                <span className="text-sm text-slate-500 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Created
                </span>
                <div className="text-right text-sm font-semibold text-slate-900">
                  <div>{new Date(task.created_at).toLocaleDateString()}</div>
                  <div className="text-[10px] font-medium text-slate-400 uppercase mt-0.5">{new Date(task.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
              
              <div className="flex justify-between items-start">
                <span className="text-sm text-slate-500 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Updated
                </span>
                <div className="text-right text-sm font-semibold text-slate-900">
                  <div>{new Date(task.updated_at).toLocaleDateString()}</div>
                  <div className="text-[10px] font-medium text-slate-400 uppercase mt-0.5">{new Date(task.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 p-6 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Change Task Status</div>
              <div className="flex bg-white rounded-lg border border-slate-200 shadow-sm p-1 mb-4">
                <button onClick={() => handleStatusChange('TODO')} className={`flex-1 py-1.5 text-xs font-semibold rounded-md ${task.status === 'TODO' ? 'text-blue-700 bg-blue-50 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>TODO</button>
                <button onClick={() => handleStatusChange('IN_PROGRESS')} className={`flex-1 py-1.5 text-xs font-semibold rounded-md ${task.status === 'IN_PROGRESS' ? 'text-blue-700 bg-blue-50 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>IN PROGRESS</button>
                <button onClick={() => handleStatusChange('COMPLETED')} className={`flex-1 py-1.5 text-xs font-semibold rounded-md ${task.status === 'COMPLETED' ? 'text-blue-700 bg-blue-50 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>DONE</button>
              </div>
              {task.status !== 'COMPLETED' && (
                <button onClick={() => handleStatusChange('COMPLETED')} className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-medium py-2.5 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Mark as Completed
                </button>
              )}
            </div>
          </div>
        </div>

      </div>

      <TaskModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        task={task}
        categories={categories}
        onSave={handleSaveEdit}
      />
      <DeleteModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        task={task}
        onConfirm={handleDeleteConfirm}
      />
    </Layout>
  );
};

export default TaskDetail;
