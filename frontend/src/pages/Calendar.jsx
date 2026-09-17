import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getTasks } from '../services/taskService';
import { getCategories } from '../services/categoryService';

const Calendar = () => {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const fetchCalendarData = async () => {
    try {
      const [tasksRes, catRes] = await Promise.all([
        getTasks(),
        getCategories()
      ]);
      setCategories(catRes.data);
      
      const enrichedTasks = tasksRes.data.map(task => ({
        ...task,
        category: catRes.data.find(c => c.id === task.category_id) || null
      }));
      setTasks(enrichedTasks);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const filteredTasks = tasks.filter(t => {
    if (filterCategory !== 'All' && t.category_id !== filterCategory) return false;
    if (filterPriority !== 'All' && t.priority !== filterPriority) return false;
    return true;
  });

  // Generate 35 days (5 weeks)
  const days = Array.from({ length: 35 }, (_, i) => {
    // Get the day of the week of the first day of the month (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    // Adjust so Monday is 0, Sunday is 6
    const startingOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    
    const date = i - startingOffset + 1;
    
    let currentDayDate = new Date(currentYear, currentMonth, date);
    const isPrevMonth = currentDayDate.getMonth() < currentMonth && currentDayDate.getFullYear() <= currentYear || currentDayDate.getFullYear() < currentYear;
    const isNextMonth = currentDayDate.getMonth() > currentMonth && currentDayDate.getFullYear() >= currentYear || currentDayDate.getFullYear() > currentYear;

    // Find first task that falls on this day for the UI preview (to match mockup style of 1 event per cell in month view)
    const dayTask = filteredTasks.find(t => {
      if (!t.due_date) return false;
      const tDate = new Date(t.due_date);
      return tDate.getDate() === currentDayDate.getDate() && tDate.getMonth() === currentDayDate.getMonth() && tDate.getFullYear() === currentDayDate.getFullYear();
    });

    let event = null;
    if (dayTask) {
      const isDone = dayTask.status === 'COMPLETED';
      const isOverdue = !isDone && new Date(dayTask.due_date) < new Date() && currentDayDate < new Date(new Date().setHours(0,0,0,0));
      
      let color = 'text-blue-600';
      let dot = 'bg-blue-600';
      if (dayTask.priority === 'HIGH' || dayTask.priority === 'URGENT') {
        color = 'text-blue-600';
        dot = 'bg-blue-600';
      } else if (dayTask.priority === 'LOW') {
        color = 'text-slate-600';
        dot = 'bg-slate-400';
      }

      if (isDone) {
        color = 'text-emerald-600';
        dot = 'bg-emerald-500';
      } else if (isOverdue) {
        color = 'text-red-600 bg-red-50 rounded px-1';
        dot = 'bg-red-500';
      }

      event = {
        id: dayTask.id,
        title: dayTask.title,
        color,
        dot,
        isDone,
        isOverdue,
        task: dayTask
      };
    }
    
    const today = new Date();
    return {
      day: currentDayDate.getDate(),
      isMuted: isPrevMonth || isNextMonth,
      isToday: currentDayDate.getDate() === today.getDate() && currentDayDate.getMonth() === today.getMonth() && currentDayDate.getFullYear() === today.getFullYear(),
      isSelected: false, // Could be hooked up to a selected day state
      event,
      fullDate: currentDayDate
    };
  });

  const today = new Date();
  const scheduledToday = filteredTasks.filter(t => {
    if (!t.due_date) return false;
    const tDate = new Date(t.due_date);
    return tDate.getDate() === today.getDate() && tDate.getMonth() === today.getMonth() && tDate.getFullYear() === today.getFullYear();
  });

  const completedCount = filteredTasks.filter(t => t.status === 'COMPLETED').length;
  const overdueCount = filteredTasks.filter(t => t.status !== 'COMPLETED' && t.due_date && new Date(t.due_date) < new Date()).length;

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-[1600px] mx-auto flex flex-col h-full overflow-hidden">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Calendar</h1>
              <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full mt-1">{tasks.length} scheduled</span>
            </div>
            <p className="text-slate-500">Visualize deadlines, organize scheduled tasks, and manage your daily workload.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <span className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-slate-600"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> {filteredTasks.length} scheduled total</span>
              <span className="flex items-center gap-1.5 px-2 py-1 bg-red-50 border border-red-100 rounded-md text-red-600"><span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> {overdueCount} overdue</span>
              <span className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 border border-emerald-100 rounded-md text-emerald-600"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> {completedCount} completed</span>
            </div>
          </div>
        </div>

        {/* Top Toolbar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
              <button onClick={() => setCurrentDate(new Date(currentYear, currentMonth - 1, 1))} className="px-2 py-1.5 hover:bg-slate-50 border-r border-slate-200"><svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
              <button onClick={() => setCurrentDate(new Date(currentYear, currentMonth + 1, 1))} className="px-2 py-1.5 hover:bg-slate-50"><svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
            </div>
            <button onClick={() => setCurrentDate(new Date())} className="px-4 py-1.5 bg-white border border-slate-200 text-sm font-medium text-slate-700 rounded-lg shadow-sm hover:bg-slate-50 transition-colors">Today</button>
            <h2 className="text-xl font-bold text-slate-800 ml-2">{monthNames[currentMonth]} {currentYear}</h2>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm mr-2 text-sm font-medium">
              <button className="px-3 py-1 text-blue-700 bg-blue-50 rounded-md shadow-sm cursor-default">Month</button>
              <button className="px-3 py-1 text-slate-400 cursor-not-allowed rounded-md opacity-50" title="Coming soon">Week</button>
              <button className="px-3 py-1 text-slate-400 cursor-not-allowed rounded-md opacity-50" title="Coming soon">Day</button>
            </div>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 shadow-sm focus:outline-none">
              <option value="All">Category: All</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 shadow-sm focus:outline-none">
              <option value="All">Priority: All</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
            <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1.5 px-4 rounded-lg shadow-sm transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Create Task
            </button>
          </div>
        </div>

        <div className="flex flex-1 gap-6 min-h-0">
          {/* Calendar Grid */}
          <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="grid grid-cols-7 border-b border-slate-200 text-center text-xs font-semibold text-slate-500 py-3 bg-slate-50/50 uppercase tracking-wider">
              <div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div>
              <div className="text-indigo-500">Sat</div><div className="text-indigo-500">Sun</div>
            </div>
            <div className="flex-1 grid grid-cols-7 grid-rows-5 bg-slate-100 gap-px">
              {days.map((d, idx) => (
                <div key={idx} className={`bg-white p-2 flex flex-col min-h-[100px] ${d.isMuted ? 'text-slate-400 bg-slate-50/50' : 'text-slate-800'} ${d.isSelected ? 'ring-2 ring-inset ring-blue-500' : ''}`}>
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full ${d.isToday ? 'bg-blue-600 text-white' : ''} ${idx % 7 >= 5 && !d.isToday ? 'text-indigo-500' : ''}`}>{d.day}</span>
                    {d.event?.isOverdue && <span className="text-[9px] font-bold text-red-500 bg-red-50 px-1 rounded uppercase">Overdue</span>}
                  </div>
                  {d.event && (
                    <div className="mt-1 relative group">
                      <div className={`text-xs font-medium px-1.5 py-1 flex items-center gap-1.5 rounded cursor-pointer hover:bg-slate-50 truncate ${d.event.color}`}>
                        {d.event.isDone ? (
                          <svg className="w-3 h-3 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${d.event.dot}`}></div>
                        )}
                        <span className={`truncate ${d.event.isDone ? 'line-through text-slate-400' : ''}`}>{d.event.title}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-80 flex flex-col gap-6 overflow-y-auto">
            {/* Mini Calendar (Visual Only) */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm text-sm">
              <div className="flex justify-between items-center mb-4 font-bold text-slate-800">
                <span>{monthNames[currentMonth]} {currentYear}</span>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentDate(new Date(currentYear, currentMonth - 1, 1))}><svg className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                  <button onClick={() => setCurrentDate(new Date(currentYear, currentMonth + 1, 1))}><svg className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
                </div>
              </div>
              <div className="grid grid-cols-7 text-center text-xs font-medium text-slate-400 mb-2">
                <div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div><div>S</div>
              </div>
              <div className="grid grid-cols-7 text-center gap-y-2 text-slate-700">
                <div className="text-slate-300">30</div><div>1</div><div>2</div><div>3</div><div>4</div><div>5</div><div>6</div>
                <div>7</div><div>8</div><div>9</div><div>10</div><div>11</div><div>12</div><div>13</div>
                <div>14</div><div>15</div><div>16</div><div>17</div><div>18</div><div>19</div><div>20</div>
                <div>21</div><div>22</div><div>23</div><div>24</div><div>25</div><div className="text-red-500 font-bold">26</div><div className="bg-blue-600 text-white rounded-full mx-1">27</div>
                <div>28</div><div>29</div><div>30</div><div>31</div><div className="text-slate-300">1</div><div className="text-slate-300">2</div><div className="text-slate-300">3</div>
              </div>
            </div>

            {/* Schedule List */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex-1">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Scheduled For Today</div>
                  <h3 className="font-bold text-slate-900">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</h3>
                </div>
                <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-0.5 rounded">{scheduledToday.length} Tasks</span>
              </div>
              
              <div className="space-y-4">
                {scheduledToday.map(t => (
                  <div key={t.id} className={`p-3 border border-slate-100 rounded-lg ${t.status === 'IN_PROGRESS' ? 'bg-blue-50/30' : 'bg-white'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> {t.category?.name || 'Uncategorized'}</span>
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded uppercase">{t.priority}</span>
                    </div>
                    <h4 className={`font-semibold text-sm leading-tight mb-2 ${t.status === 'COMPLETED' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{t.title}</h4>
                    <div className="flex justify-between items-center text-xs">
                      <span className="flex items-center gap-1 text-slate-500"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> {new Date(t.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className={`${t.status === 'IN_PROGRESS' ? 'text-blue-600 font-medium' : 'text-slate-500 font-medium'}`}>{t.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                ))}
                {scheduledToday.length === 0 && (
                  <div className="text-sm text-slate-500 italic text-center py-4">No tasks scheduled for this day.</div>
                )}
              </div>
              
              <div className="mt-4 p-3 bg-slate-50 rounded-lg flex items-center gap-2 text-sm text-slate-600 border border-slate-100">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                You have {scheduledToday.length} tasks scheduled for today.
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
               <h3 className="font-bold text-slate-800 mb-4">Categories</h3>
               <div className="space-y-3 text-sm font-medium">
                 {categories.slice(0, 5).map(cat => (
                   <div key={cat.id} className="flex justify-between items-center text-slate-700">
                     <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></span> {cat.name}</span>
                     <span className="text-slate-400 bg-slate-50 px-2 rounded-md font-semibold">{tasks.filter(t => t.category_id === cat.id).length}</span>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default Calendar;
