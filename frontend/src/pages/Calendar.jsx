import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout';
import TaskModal from '../components/TaskModal';
import { getTasks, createTask, updateTask } from '../services/taskService';
import { getCategories } from '../services/categoryService';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { PriorityBadge } from '../components/Badge';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isBefore,
  startOfDay,
} from 'date-fns';
import { vi as viLocale, enUS as enLocale } from 'date-fns/locale';

const Calendar = () => {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'agenda' : 'month',
  ); // 'month' | 'week' | 'agenda'

  const [filterCategory, setFilterCategory] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');

  // Task Modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);

  const { t, i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const dateLocale = isVi ? viLocale : enLocale;

  const fetchCalendarData = async () => {
    try {
      const [tasksRes, catRes] = await Promise.all([getTasks(), getCategories()]);
      const cats = catRes.data || [];
      setCategories(cats);

      const enrichedTasks = (tasksRes.data || []).map((task) => ({
        ...task,
        category: cats.find((c) => c.id === task.category_id) || null,
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

  useEffect(() => {
    const handleOpenCreateModal = () => handleOpenCreateForDate(selectedDate);
    window.addEventListener('openCreateTaskModal', handleOpenCreateModal);
    return () => window.removeEventListener('openCreateTaskModal', handleOpenCreateModal);
  }, [selectedDate]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filterCategory !== 'All' && String(task.category_id) !== String(filterCategory)) {
        return false;
      }
      if (filterPriority !== 'All' && task.priority !== filterPriority) {
        return false;
      }
      return true;
    });
  }, [tasks, filterCategory, filterPriority]);

  // Group all filtered tasks by 'yyyy-MM-dd'
  const tasksByDate = useMemo(() => {
    const map = {};
    filteredTasks.forEach((task) => {
      if (!task.due_date) return;
      const key = format(new Date(task.due_date), 'yyyy-MM-dd');
      if (!map[key]) map[key] = [];
      map[key].push(task);
    });
    return map;
  }, [filteredTasks]);

  // Real month grid (Monday start)
  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [currentDate]);

  // Real week days containing selectedDate
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [selectedDate]);

  const today = startOfDay(new Date());
  const selectedKey = format(selectedDate, 'yyyy-MM-dd');
  const selectedDayTasks = tasksByDate[selectedKey] || [];

  const completedCount = filteredTasks.filter((task) => task.status === 'COMPLETED').length;
  const overdueCount = filteredTasks.filter(
    (task) => task.status !== 'COMPLETED' && task.due_date && isBefore(new Date(task.due_date), today),
  ).length;

  const weekdayLabels = isVi
    ? ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const miniWeekdayLabels = isVi
    ? ['2', '3', '4', '5', '6', '7', 'CN']
    : ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const handleOpenCreateForDate = (dateObj = selectedDate) => {
    setTaskToEdit({
      title: '',
      description: '',
      category_id: '',
      status: 'TODO',
      priority: 'MEDIUM',
      due_date: format(dateObj, 'yyyy-MM-dd'),
      subtasks: [],
      _isPrefillNew: true,
    });
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task, e) => {
    if (e) e.stopPropagation();
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (payload) => {
    try {
      if (taskToEdit && !taskToEdit._isPrefillNew && taskToEdit.id) {
        await updateTask(taskToEdit.id, payload);
        toast.success(t('tasks.updated'));
      } else {
        await createTask(payload);
        toast.success(t('tasks.created'));
      }
      fetchCalendarData();
    } catch (err) {
      toast.error(isVi ? 'Lưu công việc thất bại' : 'Failed to save task');
    }
  };

  const handleToggleDone = async (task, e) => {
    e.stopPropagation();
    try {
      const nextStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
      await updateTask(task.id, { status: nextStatus });
      toast.success(
        nextStatus === 'COMPLETED'
          ? isVi
            ? 'Đã hoàn thành! 🎉'
            : 'Completed! 🎉'
          : isVi
            ? 'Đã mở lại'
            : 'Reopened',
      );
      fetchCalendarData();
    } catch {
      toast.error(isVi ? 'Không thể cập nhật' : 'Update failed');
    }
  };

  const handlePrevPeriod = () => {
    if (viewMode === 'week') {
      const prev = subWeeks(selectedDate, 1);
      setSelectedDate(prev);
      setCurrentDate(prev);
    } else {
      setCurrentDate((prev) => subMonths(prev, 1));
    }
  };

  const handleNextPeriod = () => {
    if (viewMode === 'week') {
      const next = addWeeks(selectedDate, 1);
      setSelectedDate(next);
      setCurrentDate(next);
    } else {
      setCurrentDate((prev) => addMonths(prev, 1));
    }
  };

  const handleGoToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  const getTaskPillStyle = (task, dayObj) => {
    const isDone = task.status === 'COMPLETED';
    const isOverdue = !isDone && task.due_date && isBefore(new Date(task.due_date), today) && isBefore(dayObj, today);
    if (isDone) {
      return 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-500/30';
    }
    if (isOverdue || task.priority === 'URGENT') {
      return 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-200/70 dark:border-rose-500/30';
    }
    if (task.priority === 'HIGH') {
      return 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200/70 dark:border-amber-500/30';
    }
    return 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-200/70 dark:border-indigo-500/30';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full py-20">
          <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-indigo-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-[1600px] mx-auto flex flex-col h-full">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {t('nav.calendar')}
              </h1>
              <span className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-bold px-2.5 py-0.5 rounded-full tabular-nums">
                {filteredTasks.length} {isVi ? 'công việc' : 'tasks'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {isVi
                ? 'Theo dõi hạn chót, bấm vào ngày để xem hoặc thêm nhanh công việc.'
                : 'Visualize deadlines, click any day to inspect or schedule tasks.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-300">
              <span className="w-2 h-2 bg-indigo-500 rounded-full" />
              {filteredTasks.length} {isVi ? 'đã lọc' : 'scheduled'}
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 dark:bg-rose-500/15 border border-rose-200/70 dark:border-rose-500/30 rounded-lg text-rose-600 dark:text-rose-300">
              <span className="w-2 h-2 bg-rose-500 rounded-full" />
              {overdueCount} {isVi ? 'quá hạn' : 'overdue'}
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200/70 dark:border-emerald-500/30 rounded-lg text-emerald-600 dark:text-emerald-300">
              <span className="w-2 h-2 bg-emerald-500 rounded-full" />
              {completedCount} {isVi ? 'hoàn thành' : 'completed'}
            </span>
          </div>
        </div>

        {/* Top Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4 bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={handlePrevPeriod}
                className="px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 border-r border-slate-200 dark:border-slate-700"
                aria-label="Previous"
              >
                <svg className="w-4 h-4 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleNextPeriod}
                className="px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700"
                aria-label="Next"
              >
                <svg className="w-4 h-4 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <button
              type="button"
              onClick={handleGoToday}
              className="px-3.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              {isVi ? 'Hôm nay' : 'Today'}
            </button>

            <h2 className="text-base sm:text-xl font-extrabold text-slate-800 dark:text-white capitalize ml-1">
              {format(currentDate, 'MMMM yyyy', { locale: dateLocale })}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Working View Mode Switcher */}
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700 text-xs font-bold">
              {[
                { id: 'month', label: isVi ? 'Tháng' : 'Month' },
                { id: 'week', label: isVi ? 'Tuần' : 'Week' },
                { id: 'agenda', label: isVi ? 'Lịch ngày' : 'Agenda' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setViewMode(m.id)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    viewMode === m.id
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none max-w-[150px]"
            >
              <option value="All">{t('tasks.allCategories')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="All">{t('tasks.allPriorities')}</option>
              <option value="URGENT">{t('enums.priority.URGENT')}</option>
              <option value="HIGH">{t('enums.priority.HIGH')}</option>
              <option value="MEDIUM">{t('enums.priority.MEDIUM')}</option>
              <option value="LOW">{t('enums.priority.LOW')}</option>
            </select>

            <button
              type="button"
              onClick={() => handleOpenCreateForDate(selectedDate)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold py-2 px-3.5 rounded-xl shadow-sm transition-colors flex items-center gap-1.5 ml-auto sm:ml-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>{t('tasks.create')}</span>
            </button>
          </div>
        </div>

        {/* Main Workspace Grid */}
        <div className="flex flex-col xl:flex-row flex-1 gap-6 min-h-0">
          {/* LEFT / CENTER CALENDAR VIEW */}
          <div className="flex-1 min-w-0 flex flex-col">
            {viewMode === 'month' && (
              <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto shadow-xs flex flex-col">
                <div className="min-w-[640px] flex-1 flex flex-col">
                  <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 text-center text-xs font-bold text-slate-500 dark:text-slate-400 py-3 bg-slate-50/70 dark:bg-slate-950/40 uppercase tracking-wider">
                    {weekdayLabels.map((lbl, idx) => (
                      <div key={lbl} className={idx >= 5 ? 'text-indigo-500' : ''}>
                        {lbl}
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 grid grid-cols-7 bg-slate-100 dark:bg-slate-800 gap-px">
                    {monthDays.map((dayObj) => {
                      const dayKey = format(dayObj, 'yyyy-MM-dd');
                      const dayTasks = tasksByDate[dayKey] || [];
                      const inCurrentMonth = isSameMonth(dayObj, currentDate);
                      const isDayToday = isSameDay(dayObj, today);
                      const isDaySelected = isSameDay(dayObj, selectedDate);
                      const isWeekend = dayObj.getDay() === 0 || dayObj.getDay() === 6;

                      return (
                        <div
                          key={dayKey}
                          onClick={() => setSelectedDate(dayObj)}
                          className={`group p-2 flex flex-col min-h-[104px] sm:min-h-[116px] cursor-pointer transition-colors relative ${
                            inCurrentMonth
                              ? 'bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                              : 'bg-slate-50/70 dark:bg-slate-950/60 text-slate-400 dark:text-slate-600'
                          } ${isDaySelected ? 'ring-2 ring-inset ring-indigo-500 z-10' : ''}`}
                        >
                          <div className="flex justify-between items-center mb-1.5">
                            <span
                              className={`text-xs sm:text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full tabular-nums ${
                                isDayToday
                                  ? 'bg-indigo-600 text-white shadow-sm'
                                  : isWeekend && inCurrentMonth
                                    ? 'text-indigo-500'
                                    : inCurrentMonth
                                      ? 'text-slate-800 dark:text-slate-200'
                                      : 'text-slate-400 dark:text-slate-600'
                              }`}
                            >
                              {format(dayObj, 'd')}
                            </span>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDate(dayObj);
                                handleOpenCreateForDate(dayObj);
                              }}
                              title={isVi ? 'Thêm việc vào ngày này' : 'Add task on this date'}
                              className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-md bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all"
                            >
                              +
                            </button>
                          </div>

                          <div className="space-y-1 flex-1 min-w-0">
                            {dayTasks.slice(0, 3).map((task) => (
                              <div
                                key={task.id}
                                onClick={(e) => handleOpenEditTask(task, e)}
                                className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-md border truncate flex items-center gap-1 hover:brightness-95 transition-all ${getTaskPillStyle(task, dayObj)}`}
                                title={task.title}
                              >
                                <span
                                  className={`truncate ${task.status === 'COMPLETED' ? 'line-through opacity-75' : ''}`}
                                >
                                  {task.title}
                                </span>
                              </div>
                            ))}
                            {dayTasks.length > 3 && (
                              <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 px-1">
                                +{dayTasks.length - 3} {isVi ? 'việc khác' : 'more'}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {viewMode === 'week' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs overflow-x-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 min-w-0">
                  {weekDays.map((dayObj) => {
                    const dayKey = format(dayObj, 'yyyy-MM-dd');
                    const dayTasks = tasksByDate[dayKey] || [];
                    const isDayToday = isSameDay(dayObj, today);
                    const isDaySelected = isSameDay(dayObj, selectedDate);

                    return (
                      <div
                        key={dayKey}
                        onClick={() => setSelectedDate(dayObj)}
                        className={`rounded-2xl border p-3 flex flex-col min-h-[160px] lg:min-h-[380px] cursor-pointer transition-all ${
                          isDaySelected
                            ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20'
                            : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30'
                        }`}
                      >
                        <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-200/70 dark:border-slate-800">
                          <div>
                            <p className="text-[10px] font-bold uppercase text-slate-400">
                              {format(dayObj, 'EEE', { locale: dateLocale })}
                            </p>
                            <p
                              className={`text-base font-black tabular-nums ${
                                isDayToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-white'
                              }`}
                            >
                              {format(dayObj, 'd/M')}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDate(dayObj);
                              handleOpenCreateForDate(dayObj);
                            }}
                            className="w-6 h-6 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-600 text-xs font-bold flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>

                        <div className="space-y-2 flex-1">
                          {dayTasks.length > 0 ? (
                            dayTasks.map((task) => (
                              <div
                                key={task.id}
                                onClick={(e) => handleOpenEditTask(task, e)}
                                className={`p-2 rounded-xl border text-xs font-semibold cursor-pointer ${getTaskPillStyle(task, dayObj)}`}
                              >
                                <p className={`line-clamp-2 ${task.status === 'COMPLETED' ? 'line-through opacity-75' : ''}`}>
                                  {task.title}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="text-[11px] text-slate-400 italic py-4 text-center">
                              {isVi ? 'Trống' : 'Empty'}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {viewMode === 'agenda' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
                {/* 7-Day Interactive Swipeable Date Strip */}
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {weekDays.map((dayObj) => {
                    const dayKey = format(dayObj, 'yyyy-MM-dd');
                    const count = (tasksByDate[dayKey] || []).length;
                    const isDayToday = isSameDay(dayObj, today);
                    const isDaySelected = isSameDay(dayObj, selectedDate);
                    return (
                      <button
                        key={dayKey}
                        type="button"
                        onClick={() => setSelectedDate(dayObj)}
                        className={`flex flex-col items-center py-2.5 px-1 rounded-2xl border transition-all ${
                          isDaySelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/25'
                            : isDayToday
                              ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30'
                              : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200/70 dark:border-slate-700'
                        }`}
                      >
                        <span className="text-[10px] font-bold uppercase opacity-75">
                          {format(dayObj, 'EEE', { locale: dateLocale })}
                        </span>
                        <span className="text-sm sm:text-base font-black tabular-nums mt-0.5">
                          {format(dayObj, 'd')}
                        </span>
                        <span
                          className={`w-1.5 h-1.5 rounded-full mt-1 ${
                            count > 0
                              ? isDaySelected
                                ? 'bg-white'
                                : 'bg-indigo-500'
                              : 'bg-transparent'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Selected Date Agenda List */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-800 dark:text-white capitalize text-sm sm:text-base">
                      {format(selectedDate, 'EEEE, dd/MM/yyyy', { locale: dateLocale })}
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleOpenCreateForDate(selectedDate)}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      + {t('tasks.create')}
                    </button>
                  </div>

                  {selectedDayTasks.length > 0 ? (
                    <div className="space-y-2.5">
                      {selectedDayTasks.map((task) => {
                        const isDone = task.status === 'COMPLETED';
                        return (
                          <div
                            key={task.id}
                            onClick={(e) => handleOpenEditTask(task, e)}
                            className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 flex items-start gap-3 cursor-pointer transition-colors"
                          >
                            <button
                              type="button"
                              onClick={(e) => handleToggleDone(task, e)}
                              className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 ${
                                isDone
                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : 'border-slate-300 dark:border-slate-600'
                              }`}
                            >
                              {isDone && (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-bold ${isDone ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                                {task.title}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                <PriorityBadge priority={task.priority} />
                                {task.category && (
                                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                    #{task.category.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-10 text-center text-sm text-slate-400">
                      <p className="mb-3">{isVi ? 'Không có công việc nào trong ngày này.' : 'No tasks scheduled for this day.'}</p>
                      <button
                        type="button"
                        onClick={() => handleOpenCreateForDate(selectedDate)}
                        className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 text-xs font-bold"
                      >
                        + {isVi ? 'Lên lịch công việc' : 'Schedule a task'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR: Real Mini Calendar + Selected Day Tasks + Categories */}
          <div className="w-full xl:w-80 flex flex-col gap-5 shrink-0">
            {/* Real Dynamic Mini Calendar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs text-sm">
              <div className="flex justify-between items-center mb-4 font-bold text-slate-800 dark:text-white capitalize">
                <span>{format(currentDate, 'MMMM yyyy', { locale: dateLocale })}</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentDate((prev) => subMonths(prev, 1))}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label="Previous month"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentDate((prev) => addMonths(prev, 1))}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label="Next month"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-400 mb-2">
                {miniWeekdayLabels.map((lbl, i) => (
                  <div key={i}>{lbl}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 text-center gap-y-1">
                {monthDays.map((dayObj) => {
                  const key = format(dayObj, 'yyyy-MM-dd');
                  const inMonth = isSameMonth(dayObj, currentDate);
                  const isDayToday = isSameDay(dayObj, today);
                  const isDaySelected = isSameDay(dayObj, selectedDate);
                  const hasTasks = (tasksByDate[key] || []).length > 0;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedDate(dayObj)}
                      className={`relative w-8 h-8 mx-auto rounded-full flex flex-col items-center justify-center text-xs font-semibold tabular-nums transition-colors ${
                        isDaySelected
                          ? 'bg-indigo-600 text-white font-bold shadow-sm'
                          : isDayToday
                            ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-bold'
                            : inMonth
                              ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                              : 'text-slate-300 dark:text-slate-600'
                      }`}
                    >
                      <span>{format(dayObj, 'd')}</span>
                      {hasTasks && (
                        <span
                          className={`w-1 h-1 rounded-full -mt-0.5 ${
                            isDaySelected ? 'bg-white' : 'bg-indigo-500'
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Day Schedule Panel */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4 gap-2">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                    {isSameDay(selectedDate, today)
                      ? isVi
                        ? 'Lịch trình hôm nay'
                        : 'Scheduled For Today'
                      : isVi
                        ? 'Ngày đang chọn'
                        : 'Selected Day'}
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white capitalize text-sm sm:text-base">
                    {format(selectedDate, 'EEEE, dd/MM', { locale: dateLocale })}
                  </h3>
                </div>
                <span className="bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0 tabular-nums">
                  {selectedDayTasks.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar max-h-[320px]">
                {selectedDayTasks.map((task) => {
                  const isDone = task.status === 'COMPLETED';
                  return (
                    <div
                      key={task.id}
                      onClick={(e) => handleOpenEditTask(task, e)}
                      className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 hover:border-indigo-300 dark:hover:border-indigo-500/40 cursor-pointer transition-colors"
                    >
                      <div className="flex justify-between items-center mb-1 gap-2">
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: task.category?.color || '#6366f1' }}
                          />
                          {task.category?.name || (isVi ? 'Không danh mục' : 'Uncategorized')}
                        </span>
                        <PriorityBadge priority={task.priority} />
                      </div>
                      <h4
                        className={`font-bold text-sm leading-snug mb-1.5 ${
                          isDone ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {task.title}
                      </h4>
                      <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400">
                        <span>{t(`enums.status.${task.status}`)}</span>
                        <button
                          type="button"
                          onClick={(e) => handleToggleDone(task, e)}
                          className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          {isDone ? (isVi ? 'Mở lại' : 'Reopen') : isVi ? 'Hoàn thành' : 'Mark done'}
                        </button>
                      </div>
                    </div>
                  );
                })}
                {selectedDayTasks.length === 0 && (
                  <div className="text-xs sm:text-sm text-slate-400 italic text-center py-6">
                    {isVi ? 'Chưa có công việc vào ngày này.' : 'No tasks scheduled for this day.'}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleOpenCreateForDate(selectedDate)}
                className="mt-4 w-full py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 hover:bg-indigo-100 dark:hover:bg-indigo-500/25 text-indigo-600 dark:text-indigo-300 text-xs font-bold transition-colors"
              >
                + {isVi ? 'Thêm việc ngày này' : 'Add task on this date'}
              </button>
            </div>

            {/* Categories Overview */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <h3 className="font-bold text-slate-800 dark:text-white mb-3 text-sm">
                {isVi ? 'Danh mục' : 'Categories'}
              </h3>
              <div className="space-y-2.5 text-xs sm:text-sm font-medium">
                {categories.slice(0, 6).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() =>
                      setFilterCategory((prev) => (String(prev) === String(cat.id) ? 'All' : String(cat.id)))
                    }
                    className={`w-full flex justify-between items-center px-2 py-1.5 rounded-lg transition-colors ${
                      String(filterCategory) === String(cat.id)
                        ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="truncate">{cat.name}</span>
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-bold text-xs tabular-nums">
                      {tasks.filter((task) => task.category_id === cat.id).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        task={taskToEdit}
        categories={categories}
        onSave={handleSaveTask}
        onManageCategories={() => {}}
      />
    </Layout>
  );
};

export default Calendar;
