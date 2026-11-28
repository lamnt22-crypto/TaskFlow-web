import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import TaskModal from "../components/TaskModal";
import DeleteModal from "../components/DeleteModal";
import CategoryModal from "../components/CategoryModal";
import AIPlannerModal from "../components/AIPlannerModal";
import AIFilePlannerModal from "../components/AIFilePlannerModal";
import SmartTaskInput from "../components/SmartTaskInput";
import KanbanBoard from "../components/KanbanBoard";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from "../services/taskService";
import { getCategories } from "../services/categoryService";
import { StatusBadge, PriorityBadge } from "../components/Badge";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { PomodoroContext } from "../context/PomodoroContext";
import { useGamification } from "../context/GamificationContext";

/* ═══════════════════════════════════════════
   Inline Decorative SVG Components
   ═══════════════════════════════════════════ */

// Animated floating orb decorations
const FloatingOrbs = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    {/* Primary aurora blob */}
    <div
      className="absolute -top-32 -left-32 w-[500px] h-[500px] animate-morph-blob opacity-30"
      style={{
        background:
          "linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #22d3ee 100%)",
        filter: "blur(80px)",
      }}
    />
    {/* Secondary warm blob */}
    <div
      className="absolute top-[40%] -right-24 w-[400px] h-[400px] animate-morph-blob opacity-20"
      style={{
        background:
          "linear-gradient(135deg, #34d399 0%, #06b6d4 50%, #818cf8 100%)",
        filter: "blur(90px)",
        animationDelay: "-4s",
      }}
    />
    {/* Subtle bottom accent */}
    <div
      className="absolute -bottom-20 left-1/3 w-[350px] h-[250px] animate-morph-blob opacity-15"
      style={{
        background: "linear-gradient(135deg, #f472b6 0%, #c084fc 100%)",
        filter: "blur(100px)",
        animationDelay: "-8s",
      }}
    />
  </div>
);

// Mini stat ring SVG
const StatRing = ({ value, max, color, size = 44, strokeWidth = 4 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = max > 0 ? (value / max) * circumference : 0;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-slate-100 dark:text-slate-800"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference - progress}
        className="transition-all duration-1000 ease-out"
      />
    </svg>
  );
};

const MyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("dueDateAsc");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'board'

  const { t, i18n } = useTranslation();
  const isVi = i18n.language === "vi";
  const location = useLocation();
  const navigate = useNavigate();
  const { startFocus } = React.useContext(PomodoroContext);
  const { triggerConfetti, triggerCelebration, fetchStreaks, playTingSound } =
    useGamification();

  // Bulk select state
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // Modal States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isAIPlannerModalOpen, setIsAIPlannerModalOpen] = useState(false);
  const [isAIFilePlannerModalOpen, setIsAIFilePlannerModalOpen] =
    useState(false);

  // Load Categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        if (data.success && data.data) {
          setCategories(data.data);
        }
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };
    fetchCategories();
  }, []);

  // Search Debounce
  useEffect(() => {
    const timerId = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 500);
    return () => clearTimeout(timerId);
  }, [searchInput]);

  // Listen for keyboard shortcut event, live AI task updates & ?new=1 param
  useEffect(() => {
    const handleOpenCreateModal = () => handleOpenCreate();
    window.addEventListener("openCreateTaskModal", handleOpenCreateModal);
    return () =>
      window.removeEventListener("openCreateTaskModal", handleOpenCreateModal);
  }, []);

  useEffect(() => {
    const handleTasksUpdated = () => fetchTasks(false);
    window.addEventListener("tasksUpdated", handleTasksUpdated);
    return () => window.removeEventListener("tasksUpdated", handleTasksUpdated);
  }, [sortOrder, searchQuery, statusFilter, priorityFilter, categoryFilter]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("new") === "1") {
      handleOpenCreate();
      navigate("/my-tasks", { replace: true });
    }
  }, [location.search, navigate]);

  // Load Tasks based on filters
  const fetchTasks = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const params = { sort: sortOrder };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (priorityFilter !== "ALL") params.priority = priorityFilter;
      if (categoryFilter !== "ALL") params.category = categoryFilter;

      const data = await getTasks(params);
      if (data.success) {
        setTasks(data.data || []);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || t("tasks.failedFetch"),
      );
      toast.error(t("tasks.failedFetch"));
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [searchQuery, sortOrder, statusFilter, priorityFilter, categoryFilter]);

  // Handlers
  const handleOpenCreate = () => {
    setTaskToEdit(null);
    setIsTaskModalOpen(true);
  };
  const handleOpenEdit = (task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };
  const handleOpenDelete = (task) => {
    setTaskToDelete(task);
    setIsDeleteModalOpen(true);
  };
  const handleSaveTask = async (taskData) => {
    try {
      if (taskToEdit) {
        const response = await updateTask(taskToEdit.id, taskData);
        toast.success(t("tasks.updated"));
        if (response?.data?.gamification || response?.gamification) {
          const gamification =
            response.data?.gamification || response.gamification;
          triggerConfetti(gamification.allCompleted ? "massive" : "small");
          fetchStreaks();

          if (gamification.allCompleted) {
            toast.success(
              "🎉 Tuyệt vời! Bạn đã hoàn thành TẤT CẢ công việc hôm nay!",
              { duration: 4000, icon: "🌟" },
            );
          } else {
            toast.success(
              `🔥 Chuỗi năng suất: ${gamification.currentStreak} ngày liên tiếp!`,
              { icon: "🔥" },
            );
          }
        }
      } else {
        const response = await createTask(taskData);
        toast.success(t("tasks.created"));
        if (response?.data?.gamification || response?.gamification) {
          const gamification =
            response.data?.gamification || response.gamification;
          playTingSound();
          triggerConfetti(gamification.allCompleted ? "massive" : "small");
          fetchStreaks();

          if (gamification.allCompleted) {
            toast.success(
              "🎉 Tuyệt vời! Bạn đã hoàn thành TẤT CẢ công việc hôm nay!",
              { duration: 4000, icon: "🌟" },
            );
          } else {
            toast.success(
              `🔥 Chuỗi năng suất: ${gamification.currentStreak} ngày liên tiếp!`,
              { icon: "🔥" },
            );
          }
        }
      }
      fetchTasks(false);
    } catch (err) {
      toast.error("Operation failed");
    }
  };

  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      const task = tasks.find((t) => t.id === taskId);
      const response = await updateTask(taskId, { status: newStatus });
      if (newStatus === "COMPLETED") {
        playTingSound();
        const gamification =
          response?.data?.gamification || response?.gamification;
        triggerCelebration({
          type: gamification?.allCompleted ? "all_completed" : "task_completed",
          taskTitle: task?.title || "",
          xpEarned: 100,
          streakCount: gamification?.currentStreak || 3,
        });
        fetchStreaks();
      }
      fetchTasks(false);
    } catch (error) {
      toast.error("Failed to update task status");
    }
  };

  const handleDeleteConfirm = async (taskId) => {
    try {
      await deleteTask(taskId);
      toast.success(t("tasks.deleted"));
      fetchTasks(false);
    } catch (err) {
      toast.error("Failed to delete task");
    }
  };
  const toggleSelectTask = (taskId) => {
    setSelectedIds((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId],
    );
  };

  const handleBulkComplete = async () => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(
        selectedIds.map((id) => updateTask(id, { status: "COMPLETED" })),
      );
      playTingSound();
      triggerConfetti("small");
      fetchStreaks();
      toast.success(
        isVi
          ? `Đã hoàn thành ${selectedIds.length} công việc!`
          : `Completed ${selectedIds.length} tasks!`,
      );
      setSelectedIds([]);
      setIsSelectMode(false);
      fetchTasks(false);
    } catch {
      toast.error(isVi ? "Cập nhật hàng loạt thất bại" : "Bulk complete failed");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(selectedIds.map((id) => deleteTask(id)));
      toast.success(
        isVi
          ? `Đã xóa ${selectedIds.length} công việc!`
          : `Deleted ${selectedIds.length} tasks!`,
      );
      setSelectedIds([]);
      setIsSelectMode(false);
      fetchTasks(false);
    } catch {
      toast.error(isVi ? "Xóa hàng loạt thất bại" : "Bulk delete failed");
    }
  };

  const handleToggleStatus = async (task) => {
    try {
      const newStatus = task.status === "COMPLETED" ? "TODO" : "COMPLETED";
      const response = await updateTask(task.id, {
        ...task,
        status: newStatus,
      });
      toast.success(
        newStatus === "COMPLETED" ? "Task marked as done! 🎉" : "Task reopened",
      );
      if (
        newStatus === "COMPLETED" &&
        (response?.data?.gamification || response?.gamification)
      ) {
        const gamification =
          response.data?.gamification || response.gamification;
        playTingSound();
        triggerConfetti(gamification.allCompleted ? "massive" : "small");
        fetchStreaks();

        if (gamification.allCompleted) {
          toast.success(
            "🎉 Tuyệt vời! Bạn đã hoàn thành TẤT CẢ công việc hôm nay!",
            { duration: 4000, icon: "🌟" },
          );
        } else {
          toast.success(
            `🔥 Chuỗi năng suất: ${gamification.currentStreak} ngày liên tiếp!`,
            { icon: "🔥" },
          );
        }
      }
      fetchTasks(false);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleExportCSV = () => {
    if (tasks.length === 0) {
      toast.error("Không có dữ liệu để xuất");
      return;
    }

    const BOM = "\uFEFF"; // For Excel UTF-8 support
    let csvContent =
      BOM + "ID,Title,Description,Status,Priority,Due Date,Category\n";

    enrichedTasks.forEach((task) => {
      const escapeCsv = (str) => {
        if (!str) return '""';
        const stringified = String(str);
        return `"${stringified.replace(/"/g, '""')}"`;
      };

      const row = [
        task.id,
        escapeCsv(task.title),
        escapeCsv(task.description),
        escapeCsv(task.status),
        escapeCsv(task.priority),
        task.due_date
          ? escapeCsv(new Date(task.due_date).toLocaleDateString())
          : '""',
        escapeCsv(task.category ? task.category.name : "Uncategorized"),
      ].join(",");

      csvContent += row + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `TaskFlow_Export_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Xuất dữ liệu thành công!", { icon: "📥" });
  };

  // Enrich tasks with category data and group them
  const enrichedTasks = tasks.map((task) => {
    const matchedCategory = categories.find((c) => c.id === task.category_id);
    return { ...task, category: matchedCategory || null };
  });

  const isToday = (dateStr) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isUpcoming = (dateStr) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return date > today;
  };

  const todayTasks = enrichedTasks.filter(
    (t) => t.status !== "COMPLETED" && isToday(t.due_date),
  );
  const upcomingTasks = enrichedTasks.filter(
    (t) => t.status !== "COMPLETED" && isUpcoming(t.due_date),
  );
  const completedTasks = enrichedTasks.filter((t) => t.status === "COMPLETED");

  // Tasks that don't fit Today or Upcoming (e.g. past due non-completed, or no due date)
  const otherTasks = enrichedTasks.filter(
    (task) =>
      task.status !== "COMPLETED" &&
      !isToday(task.due_date) &&
      !isUpcoming(task.due_date),
  );

  const activeCount =
    todayTasks.length + upcomingTasks.length + otherTasks.length;
  const overdueCount = otherTasks.filter(
    (task) => task.due_date && new Date(task.due_date) < new Date(),
  ).length;
  const totalCount = enrichedTasks.length;
  const completionRate =
    totalCount > 0 ? Math.round((completedTasks.length / totalCount) * 100) : 0;

  /* ═══════════════════════════════════════════
     Premium Task Row Component
     ═══════════════════════════════════════════ */
  const TaskRow = ({ task, index }) => {
    const priorityGlow =
      task.priority === "URGENT"
        ? "priority-glow-urgent"
        : task.priority === "HIGH"
          ? "priority-glow-high"
          : task.priority === "MEDIUM"
            ? "priority-glow-medium"
            : "priority-glow-low";
    const isCompleted = task.status === "COMPLETED";
    const isSelected = selectedIds.includes(task.id);

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{
          opacity: 0,
          x: -30,
          scale: 0.96,
          transition: { duration: 0.2 },
        }}
        transition={{
          delay: Math.min(index * 0.03, 0.25),
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        onClick={() => (isSelectMode ? toggleSelectTask(task.id) : handleOpenEdit(task))}
        className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 mb-3 glass-card rounded-2xl overflow-hidden task-row-shimmer cursor-pointer
        ${priorityGlow}
        hover:shadow-[0_12px_36px_-8px_rgba(99,102,241,0.18)] hover:-translate-y-0.5 transition-all duration-300 ease-out
        ${isSelected ? "ring-2 ring-indigo-500" : ""}
        ${isCompleted ? "opacity-60 saturate-75" : ""}`}
      >
        <div className="flex items-start gap-3.5 relative z-10 flex-1 min-w-0">
          {/* Bulk Selection or Complete Checkbox */}
          {isSelectMode ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleSelectTask(task.id);
              }}
              aria-label="Select task"
              className={`mt-0.5 shrink-0 w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all ${
                isSelected
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "border-slate-300 dark:border-slate-600"
              }`}
            >
              {isSelected && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleStatus(task);
              }}
              aria-label="Toggle task completion"
              className={`mt-0.5 shrink-0 w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all duration-300 ${
                isCompleted
                  ? "bg-gradient-to-br from-emerald-400 to-teal-500 border-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.35)]"
                  : "border-slate-300 dark:border-slate-600 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/15 hover:scale-105"
              }`}
            >
              {isCompleted && (
                <motion.svg
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </motion.svg>
              )}
            </button>
          )}

          <div className="flex-1 min-w-0">
            <h3
              className={`font-bold text-sm sm:text-[15px] leading-snug transition-colors ${
                isCompleted
                  ? "text-slate-400 dark:text-slate-500 line-through decoration-2"
                  : "text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
              }`}
            >
              {task.title}
            </h3>
            {task.description && (
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 line-clamp-1 max-w-2xl leading-relaxed">
                {task.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              {task.subtasks && task.subtasks.length > 0 && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 px-2 py-0.5 rounded-lg">
                  <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  {task.subtasks.filter((s) => s.is_completed).length}/{task.subtasks.length}
                </span>
              )}
              {task.category && (
                <span
                  className="flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-lg border"
                  style={{
                    borderColor: (task.category.color || "#6366f1") + "35",
                    color: task.category.color || "#6366f1",
                    backgroundColor: (task.category.color || "#6366f1") + "12",
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: task.category.color || "#6366f1" }}
                  />
                  {task.category.name}
                </span>
              )}
              <PriorityBadge priority={task.priority} />
            </div>
          </div>
        </div>

        {/* Right Side: Due Date + Accessible Action Buttons */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 shrink-0 relative z-10 pl-10 sm:pl-0"
        >
          {task.due_date && (
            <div
              className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-xl border transition-colors whitespace-nowrap ${
                isCompleted
                  ? "bg-slate-100 dark:bg-slate-800/80 text-slate-400 border-slate-200 dark:border-slate-700"
                  : isToday(task.due_date)
                    ? "bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-500/30"
                    : new Date(task.due_date) < new Date()
                      ? "bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-300 border-red-200 dark:border-red-500/30"
                      : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {isToday(task.due_date) ? (isVi ? "Hôm nay, " : "Today, ") : ""}
              {new Date(task.due_date).toLocaleTimeString(isVi ? "vi-VN" : "en-US", {
                hour: "2-digit",
                minute: "2-digit",
                ...(isToday(task.due_date) ? {} : { month: "short", day: "numeric" }),
              })}
            </div>
          )}

          {/* Action Buttons (Visible on mobile/tablet, reveal cleanly on desktop hover) */}
          <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200">
            <button
              type="button"
              onClick={() => startFocus(task)}
              className="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/15 transition-colors"
              title="Start Focus"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => navigate(`/tasks/${task.id}`)}
              className="p-2 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 rounded-xl hover:bg-cyan-50 dark:hover:bg-cyan-500/15 transition-colors"
              title={isVi ? "Xem chi tiết" : "Task details"}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => handleOpenEdit(task)}
              className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-500/15 transition-colors"
              title={isVi ? "Chỉnh sửa" : "Edit"}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => handleOpenDelete(task)}
              className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/15 transition-colors"
              title={isVi ? "Xóa" : "Delete"}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  /* ═══════════════════════════════════════════
     Section Header Component
     ═══════════════════════════════════════════ */
  const SectionHeader = ({ icon, iconBg, title, count, countBg }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between mb-4"
    >
      <h2 className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2.5 section-header-line">
        <span className={`p-2 rounded-xl ${iconBg} dark:bg-slate-800 shadow-sm`}>{icon}</span>
        {title}
        <span className={`${countBg} dark:bg-slate-800 dark:text-slate-200 px-2.5 py-0.5 rounded-full text-xs font-black tabular-nums`}>
          {count}
        </span>
      </h2>
    </motion.div>
  );

  /* ═══════════════════════════════════════════
     Loading Skeleton
     ═══════════════════════════════════════════ */
  const LoadingSkeleton = () => (
    <div className="flex flex-col gap-4 mt-8">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="h-20 rounded-2xl animate-shimmer"
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );

  return (
    <Layout>
      <div className="max-w-6xl mx-auto flex flex-col h-full pb-12 relative">
        <FloatingOrbs />

        <div className="relative z-10 flex flex-col h-full">
          {/* ══════════ Premium Hero Banner ══════════ */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-3xl mb-8 mt-2"
            style={{
              background:
                "linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(139,92,246,0.08) 40%, rgba(6,182,212,0.05) 100%)",
              border: "1px solid rgba(99,102,241,0.12)",
            }}
          >
            {/* Inner aurora glow */}
            <div className="absolute inset-0 pointer-events-none z-0">
              <div
                className="absolute top-0 right-0 w-[400px] h-[300px] animate-morph-blob opacity-20"
                style={{
                  background:
                    "radial-gradient(circle, rgba(99,102,241,0.3), transparent 70%)",
                  filter: "blur(50px)",
                }}
              />
              <div
                className="absolute bottom-0 left-0 w-[300px] h-[200px] animate-morph-blob opacity-15"
                style={{
                  background:
                    "radial-gradient(circle, rgba(139,92,246,0.3), transparent 70%)",
                  filter: "blur(50px)",
                  animationDelay: "-5s",
                }}
              />
            </div>

            <div className="relative z-10 p-5 sm:p-7 xl:p-8 flex flex-col xl:flex-row items-stretch xl:items-center gap-6 xl:gap-8">
              {/* Left Content */}
              <div className="flex-1 min-w-0">
                {/* Title Row (Pairs with compact Tablet actions on md..xl) */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        delay: 0.2,
                        type: "spring",
                        stiffness: 200,
                        damping: 15,
                      }}
                      className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0"
                    >
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                        />
                      </svg>
                    </motion.div>

                    <div className="min-w-0">
                      <h1 className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-indigo-700 to-purple-700 dark:from-white dark:via-indigo-300 dark:to-purple-300 bg-clip-text text-transparent leading-tight truncate">
                        {t("tasks.title")}
                      </h1>
                      <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mt-0.5">
                        {t("tasks.subtitle")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stats Row - Spacious Full-Width Grid (2x2 Phone, 4-col Tablet & Desktop) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 sm:mt-6">
                  {/* Total Active */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    whileHover={{ y: -3, scale: 1.02 }}
                    className="glass-card p-3.5 sm:p-4 rounded-2xl cursor-default group min-w-0 overflow-hidden"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:shadow-lg group-hover:shadow-indigo-500/30 transition-shadow shrink-0">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                      </div>
                      <p className="text-2xl font-black text-slate-800 dark:text-white leading-none tabular-nums">
                        {activeCount}
                      </p>
                    </div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-300 mt-2.5 truncate">
                      {isVi ? "Đang hoạt động" : "Active tasks"}
                    </p>
                  </motion.div>

                  {/* Completion Rate */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    whileHover={{ y: -3, scale: 1.02 }}
                    className="glass-card p-3.5 sm:p-4 rounded-2xl cursor-default group min-w-0 overflow-hidden"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <StatRing
                          value={completedTasks.length}
                          max={totalCount}
                          color="#10b981"
                          size={40}
                          strokeWidth={4}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                          {completionRate}%
                        </span>
                      </div>
                      <p className="text-2xl font-black text-slate-800 dark:text-white leading-none tabular-nums truncate">
                        {completedTasks.length}
                        <span className="text-sm text-slate-400 font-bold">
                          /{totalCount}
                        </span>
                      </p>
                    </div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-300 mt-2.5 truncate">
                      {isVi ? "Hoàn thành" : "Completed"}
                    </p>
                  </motion.div>

                  {/* Today */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    whileHover={{ y: -3, scale: 1.02 }}
                    className="glass-card p-3.5 sm:p-4 rounded-2xl cursor-default group min-w-0 overflow-hidden"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:shadow-lg group-hover:shadow-amber-500/30 transition-shadow shrink-0">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                          />
                        </svg>
                      </div>
                      <p className="text-2xl font-black text-slate-800 dark:text-white leading-none tabular-nums">
                        {todayTasks.length}
                      </p>
                    </div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-300 mt-2.5 truncate">
                      {isVi ? "Hôm nay" : "Today"}
                    </p>
                  </motion.div>

                  {/* Overdue */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    whileHover={{ y: -3, scale: 1.02 }}
                    className={`glass-card p-3.5 sm:p-4 rounded-2xl cursor-default group min-w-0 overflow-hidden relative ${overdueCount > 0 ? "ring-1 ring-red-200/60" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md transition-shadow shrink-0 ${
                          overdueCount > 0
                            ? "bg-gradient-to-br from-red-400 to-rose-500 shadow-red-500/20 group-hover:shadow-red-500/30"
                            : "bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-500/20 group-hover:shadow-emerald-500/30"
                        }`}
                      >
                        {overdueCount > 0 ? (
                          <svg
                            className="w-5 h-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-5 h-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                      <p
                        className={`text-2xl font-black leading-none tabular-nums ${overdueCount > 0 ? "text-red-500" : "text-emerald-500"}`}
                      >
                        {overdueCount}
                      </p>
                    </div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-300 mt-2.5 truncate">
                      {overdueCount > 0
                        ? isVi
                          ? "Quá hạn"
                          : "Overdue"
                        : isVi
                          ? "Tốt lắm!"
                          : "On track!"}
                    </p>
                    {overdueCount > 0 && (
                      <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-400 animate-pulse shadow-[0_0_8px_rgba(248,113,113,0.6)]" />
                    )}
                  </motion.div>
                </div>
              </div>

              {/* Right - 3D Hero Illustration (Desktop xl+) + Action Buttons (Responsive across Mobile/Tablet/Desktop) */}
              <div className="flex flex-col items-center gap-4 w-full xl:w-[285px] shrink-0">
                {/* 3D Hero Image - Visible cleanly on Desktop xl+ where Hero has ample room */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.85, rotate: -3 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{
                    delay: 0.3,
                    type: "spring",
                    stiffness: 150,
                    damping: 20,
                  }}
                  className="relative hidden xl:block mb-1"
                >
                  <div className="absolute -inset-4 bg-gradient-to-r from-indigo-400/20 via-purple-400/20 to-cyan-400/20 rounded-[30px] blur-2xl animate-aurora" />
                  <motion.img
                    src="/hero-tasks-3d.jpg"
                    alt="TaskFlow 3D"
                    className="w-52 h-52 object-cover rounded-3xl shadow-2xl shadow-indigo-500/15 border border-white/40"
                    animate={{ y: [0, -6, 0] }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.7, type: "spring", stiffness: 500 }}
                    className="absolute -bottom-3 -right-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-3.5 py-1.5 rounded-2xl text-xs font-black shadow-lg shadow-indigo-500/30 flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <span className="text-sm">🚀</span> {activeCount}{" "}
                    {t("kanban.active")}
                  </motion.div>
                </motion.div>

                {/* Action Buttons - Stacked on Mobile & Desktop xl+, clean side-by-side Row on Tablet (sm..xl) */}
                <div className="flex flex-col md:flex-row xl:flex-col gap-2.5 w-full">
                  <motion.button
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleOpenCreate}
                    className="h-11 xl:h-12 md:w-56 xl:w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-800 text-white font-bold px-5 rounded-2xl shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all flex items-center justify-center gap-2 text-sm shrink-0"
                  >
                    <svg
                      className="w-5 h-5 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <span>{t("tasks.create")}</span>
                  </motion.button>

                  <div className="grid grid-cols-3 gap-2 flex-1 xl:w-full min-w-0">
                    <motion.button
                      whileHover={{ y: -2, scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setIsAIPlannerModalOpen(true)}
                      className="h-11 xl:h-10 glass-card hover:shadow-lg text-indigo-600 dark:text-indigo-300 font-bold px-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs whitespace-nowrap min-w-0"
                      title="AI Smart Planner"
                    >
                      <span className="text-sm sm:text-base shrink-0">🪄</span>{" "}
                      <span className="truncate">AI Plan</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ y: -2, scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setIsAIFilePlannerModalOpen(true)}
                      className="h-11 xl:h-10 glass-card hover:shadow-lg text-violet-600 dark:text-violet-300 font-bold px-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs whitespace-nowrap min-w-0"
                      title="AI File Planner"
                    >
                      <span className="text-sm sm:text-base shrink-0">📄</span>{" "}
                      <span className="truncate">{isVi ? "Tệp AI" : "AI File"}</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ y: -2, scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleExportCSV}
                      className="h-11 xl:h-10 glass-card hover:shadow-lg text-slate-600 dark:text-slate-200 font-bold px-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs whitespace-nowrap min-w-0"
                      title="Export CSV"
                    >
                      <span className="text-sm sm:text-base shrink-0">📥</span>{" "}
                      <span className="truncate">{isVi ? "Xuất CSV" : "Export"}</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ══════════ Smart AI Input — Premium Card ══════════ */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.25,
              type: "spring",
              stiffness: 200,
              damping: 25,
            }}
            className="relative mb-8 z-10"
          >
            {/* Outer glow */}
            <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-400/30 via-purple-400/30 to-cyan-400/30 rounded-[28px] blur-xl opacity-40 group-hover:opacity-70 transition-all duration-700 animate-aurora pointer-events-none" />

            <div
              className="relative glass-card rounded-3xl p-5 flex items-center gap-5 overflow-hidden group hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-500"
              style={{ border: "1px solid rgba(99,102,241,0.15)" }}
            >
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-[200px] h-[120px] bg-gradient-to-bl from-indigo-500/5 via-purple-500/5 to-transparent rounded-bl-[60px] pointer-events-none" />

              {/* AI Robot Mascot */}
              <motion.div
                className="hidden sm:flex shrink-0 relative"
                animate={{ y: [0, -5, 0] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <div className="absolute -inset-2 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-full blur-lg animate-pulse" />
                <img
                  src="/ai-assistant.jpg"
                  alt="AI Assistant"
                  className="w-16 h-16 rounded-2xl object-cover shadow-lg shadow-indigo-500/20 ring-2 ring-white/60 relative z-10"
                />
                {/* Online dot */}
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white shadow-lg shadow-emerald-500/40 z-20 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
              </motion.div>

              {/* Input area */}
              <div className="flex-1 min-w-0">
                {/* Label */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-black uppercase tracking-widest bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    ✨ Trợ lý AI thông minh
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    NLP + Voice
                  </span>
                </div>

                <SmartTaskInput
                  onSubmit={async (taskData) => {
                    try {
                      const response = await createTask(taskData);
                      toast.success(t("tasks.created"));
                      if (
                        response?.data?.gamification ||
                        response?.gamification
                      ) {
                        const gamification =
                          response.data?.gamification || response.gamification;
                        playTingSound();
                        triggerConfetti(
                          gamification.allCompleted ? "massive" : "small",
                        );
                        fetchStreaks();
                        if (gamification.allCompleted) {
                          toast.success(
                            "🎉 Tuyệt vời! Bạn đã hoàn thành TẤT CẢ công việc hôm nay!",
                            { duration: 4000, icon: "🌟" },
                          );
                        } else {
                          toast.success(
                            `🔥 Chuỗi năng suất: ${gamification.currentStreak} ngày liên tiếp!`,
                            { icon: "🔥" },
                          );
                        }
                      }
                      fetchTasks(false);
                    } catch (err) {
                      toast.error("Failed to create task from smart input");
                    }
                  }}
                  isSubmitting={false}
                />
              </div>
            </div>
          </motion.div>

          {/* ══════════ Premium 2-Tier Responsive Toolbar ══════════ */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-3 sm:p-3.5 rounded-2xl mb-6 flex flex-col gap-2.5 shadow-sm border border-slate-200/70 dark:border-slate-800 overflow-hidden"
          >
            {/* Row 1: Search Input + Multi-select + View Mode Toggle */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 min-w-0">
              {/* Search Input */}
              <div className="relative flex-1 min-w-0 h-10 sm:h-11">
                <svg
                  className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  id="global-search-input"
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={t("tasks.search")}
                  className="w-full h-full pl-10 pr-8 bg-slate-50/90 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-slate-200/70 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all font-medium placeholder-slate-400"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => setSearchInput("")}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-700 text-xs transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Quick Actions: Bulk Select + List/Board Switch */}
              <div className="flex items-center gap-2 shrink-0 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsSelectMode((prev) => !prev);
                    setSelectedIds([]);
                  }}
                  className={`px-3.5 h-10 sm:h-11 rounded-xl text-xs font-bold border transition-all whitespace-nowrap flex items-center justify-center gap-1.5 shrink-0 ${
                    isSelectMode
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/25"
                      : "bg-slate-50/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200/70 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800"
                  }`}
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    {isSelectMode
                      ? isVi
                        ? "Đang chọn"
                        : "Selecting"
                      : isVi
                        ? "Chọn nhiều"
                        : "Select"}
                  </span>
                </button>

                {/* View Mode Toggle */}
                <div className="relative flex items-center bg-slate-100/90 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 rounded-xl p-1 h-10 sm:h-11 flex-1 sm:flex-none sm:w-48 shrink-0">
                  <motion.div
                    layout
                    className="absolute top-1 bottom-1 rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 shadow-md shadow-indigo-500/20"
                    style={{
                      width: "calc(50% - 4px)",
                      left: viewMode === "list" ? "4px" : "calc(50%)",
                    }}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />

                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={`relative z-10 text-xs font-bold rounded-lg transition-colors duration-200 flex items-center gap-1.5 flex-1 justify-center h-full whitespace-nowrap px-2 ${
                      viewMode === "list"
                        ? "text-white"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    <span>{t("kanban.list")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode("board")}
                    className={`relative z-10 text-xs font-bold rounded-lg transition-colors duration-200 flex items-center gap-1.5 flex-1 justify-center h-full whitespace-nowrap px-2 ${
                      viewMode === "board"
                        ? "text-white"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                    <span>{t("kanban.board")}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Row 2: Aligned 2x2 (Mobile/Tablet) -> 4-Column (Desktop) Filters & Sort */}
            <div className="pt-2.5 border-t border-slate-200/70 dark:border-slate-800 grid grid-cols-2 lg:grid-cols-4 gap-2">
              {/* Status filter */}
              <div className="min-w-0 flex items-center bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 rounded-xl px-2.5 sm:px-3 h-10 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/15 transition-all">
                <select
                  aria-label={t("tasks.allStatuses")}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full min-w-0 bg-transparent border-none text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer h-full truncate dark:[&>option]:bg-slate-900 dark:[&>option]:text-slate-100"
                >
                  <option value="ALL">{t("tasks.allStatuses")}</option>
                  <option value="TODO">{t("enums.status.TODO")}</option>
                  <option value="IN_PROGRESS">{t("enums.status.IN_PROGRESS")}</option>
                  <option value="COMPLETED">{t("enums.status.COMPLETED")}</option>
                </select>
              </div>

              {/* Priority filter */}
              <div className="min-w-0 flex items-center bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 rounded-xl px-2.5 sm:px-3 h-10 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/15 transition-all">
                <select
                  aria-label={t("tasks.allPriorities")}
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full min-w-0 bg-transparent border-none text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer h-full truncate dark:[&>option]:bg-slate-900 dark:[&>option]:text-slate-100"
                >
                  <option value="ALL">{t("tasks.allPriorities")}</option>
                  <option value="URGENT">{t("enums.priority.URGENT")}</option>
                  <option value="HIGH">{t("enums.priority.HIGH")}</option>
                  <option value="MEDIUM">{t("enums.priority.MEDIUM")}</option>
                  <option value="LOW">{t("enums.priority.LOW")}</option>
                </select>
              </div>

              {/* Category filter + settings */}
              <div className="min-w-0 flex items-center gap-1.5 bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 rounded-xl pl-2.5 sm:pl-3 pr-1.5 h-10 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/15 transition-all">
                <select
                  aria-label={t("tasks.allCategories")}
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full min-w-0 flex-1 bg-transparent border-none text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer h-full truncate dark:[&>option]:bg-slate-900 dark:[&>option]:text-slate-100"
                >
                  <option value="ALL">{t("tasks.allCategories")}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 shrink-0" />
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="w-7 h-7 flex items-center justify-center text-slate-500 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-900 rounded-lg shadow-xs border border-slate-200/70 dark:border-slate-700 transition-all shrink-0"
                  title={isVi ? "Quản lý danh mục" : "Manage Categories"}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>

              {/* Sort Dropdown */}
              <div className="min-w-0 flex items-center gap-1.5 bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 rounded-xl px-2.5 sm:px-3 h-10 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/15 transition-all">
                <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                <select
                  aria-label="Sort tasks"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full min-w-0 bg-transparent border-none text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer h-full truncate dark:[&>option]:bg-slate-900 dark:[&>option]:text-slate-100"
                >
                  <option value="dueDateAsc">{t("tasks.sortDueAsc")}</option>
                  <option value="dueDateDesc">{t("tasks.sortDueDesc")}</option>
                  <option value="createdAtDesc">{t("tasks.sortNewest")}</option>
                </select>
              </div>
            </div>

            {/* Active Filter Reset Strip */}
            {(searchInput || statusFilter !== "ALL" || priorityFilter !== "ALL" || categoryFilter !== "ALL") && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  {isVi
                    ? `Đang lọc • ${enrichedTasks.length} công việc khớp`
                    : `Filtered • ${enrichedTasks.length} matching tasks`}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setStatusFilter("ALL");
                    setPriorityFilter("ALL");
                    setCategoryFilter("ALL");
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-200/70 dark:border-rose-500/30 font-semibold hover:bg-rose-100 dark:hover:bg-rose-500/25 transition-colors"
                >
                  <span>✕</span>
                  <span>{isVi ? "Đặt lại bộ lọc" : "Reset filters"}</span>
                </button>
              </div>
            )}
          </motion.div>

          {/* Bulk Action Bar */}
          <AnimatePresence>
            {isSelectMode && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 rounded-2xl bg-indigo-600 text-white flex flex-wrap items-center justify-between gap-2.5 shadow-lg shadow-indigo-500/25"
              >
                <span className="text-xs sm:text-sm font-bold px-1.5">
                  {selectedIds.length > 0
                    ? isVi
                      ? `Đã chọn ${selectedIds.length} công việc`
                      : `${selectedIds.length} selected`
                    : isVi
                      ? "Nhấn vào các công việc bên dưới để chọn hàng loạt"
                      : "Tap tasks below to select multiple"}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {enrichedTasks.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedIds(
                          selectedIds.length === enrichedTasks.length
                            ? []
                            : enrichedTasks.map((t) => t.id),
                        )
                      }
                      className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors"
                    >
                      {selectedIds.length === enrichedTasks.length
                        ? isVi
                          ? "Bỏ chọn hết"
                          : "Unselect all"
                        : isVi
                          ? "Chọn tất cả"
                          : "Select all"}
                    </button>
                  )}
                  {selectedIds.length > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={handleBulkComplete}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition-colors"
                      >
                        ✓ {isVi ? "Hoàn thành" : "Complete"}
                      </button>
                      <button
                        type="button"
                        onClick={handleBulkDelete}
                        className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold transition-colors"
                      >
                        🗑 {isVi ? "Xóa" : "Delete"}
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedIds([]);
                      setIsSelectMode(false);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors"
                  >
                    {t("form.cancel")}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ══════════ Content Area ══════════ */}
          {isLoading ? (
            <LoadingSkeleton />
          ) : error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center flex-1 py-12 glass-card rounded-2xl"
            >
              <div className="w-16 h-16 mb-4 text-red-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-red-500 font-medium text-sm">{error}</p>
            </motion.div>
          ) : enrichedTasks.length > 0 ? (
            viewMode === "board" ? (
              <KanbanBoard
                tasks={enrichedTasks}
                onTaskStatusChange={handleTaskStatusChange}
                onEdit={handleOpenEdit}
              />
            ) : (
              <div className="flex flex-col gap-8">
                {/* Today */}
                {todayTasks.length > 0 && (
                  <div>
                    <SectionHeader
                      icon={
                        <svg
                          className="w-5 h-5 text-amber-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                          />
                        </svg>
                      }
                      iconBg="bg-amber-50"
                      title={t("tasks.today")}
                      count={todayTasks.length}
                      countBg="bg-amber-100 text-amber-700"
                    />
                    <AnimatePresence>
                      {todayTasks.map((task, i) => (
                        <TaskRow key={task.id} task={task} index={i} />
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                {/* Other (Past Due / No Date) */}
                {otherTasks.length > 0 && (
                  <div>
                    <SectionHeader
                      icon={
                        <svg
                          className="w-5 h-5 text-rose-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      }
                      iconBg="bg-rose-50"
                      title={t("tasks.otherActive")}
                      count={otherTasks.length}
                      countBg="bg-rose-100 text-rose-600"
                    />
                    <AnimatePresence>
                      {otherTasks.map((task, i) => (
                        <TaskRow key={task.id} task={task} index={i} />
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                {/* Upcoming */}
                {upcomingTasks.length > 0 && (
                  <div>
                    <SectionHeader
                      icon={
                        <svg
                          className="w-5 h-5 text-blue-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      }
                      iconBg="bg-blue-50"
                      title={t("tasks.upcoming")}
                      count={upcomingTasks.length}
                      countBg="bg-blue-100 text-blue-600"
                    />
                    <AnimatePresence>
                      {upcomingTasks.map((task, i) => (
                        <TaskRow key={task.id} task={task} index={i} />
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                {/* Completed */}
                {completedTasks.length > 0 && (
                  <div>
                    <SectionHeader
                      icon={
                        <svg
                          className="w-5 h-5 text-emerald-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      }
                      iconBg="bg-emerald-50"
                      title={t("tasks.completed")}
                      count={completedTasks.length}
                      countBg="bg-emerald-100 text-emerald-600"
                    />
                    <motion.div layout className="transition-opacity">
                      <AnimatePresence>
                        {completedTasks.map((task, i) => (
                          <TaskRow key={task.id} task={task} index={i} />
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  </div>
                )}
              </div>
            )
          ) : (
            /* ══════════ Premium Empty State ══════════ */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center flex-1 py-20 glass-card rounded-3xl mt-8"
            >
              <div className="relative w-48 h-48 mb-8">
                {/* Animated gradient ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 animate-aurora opacity-30 blur-xl" />
                <div className="relative w-full h-full flex items-center justify-center">
                  <svg
                    viewBox="0 0 200 200"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-36 h-36 drop-shadow-xl"
                  >
                    <rect
                      x="30"
                      y="30"
                      width="140"
                      height="140"
                      rx="30"
                      fill="url(#emptyGrad1)"
                      fillOpacity="0.9"
                    />
                    <path
                      d="M70 70H130M70 100H130M70 130H100"
                      stroke="white"
                      strokeWidth="10"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="145"
                      cy="145"
                      r="30"
                      fill="url(#emptyGrad2)"
                      stroke="white"
                      strokeWidth="5"
                    />
                    <path
                      d="M135 145L142 152L155 138"
                      stroke="white"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <defs>
                      <linearGradient
                        id="emptyGrad1"
                        x1="30"
                        y1="30"
                        x2="170"
                        y2="170"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#818cf8" />
                        <stop offset="1" stopColor="#a78bfa" />
                      </linearGradient>
                      <linearGradient
                        id="emptyGrad2"
                        x1="115"
                        y1="115"
                        x2="175"
                        y2="175"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#34d399" />
                        <stop offset="1" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">
                {t("tasks.noTasksFilter")}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 text-center max-w-sm px-4">
                {isVi
                  ? "Hãy tận hưởng thời gian rảnh, hoặc tạo một nhiệm vụ mới để bắt đầu hành trình năng suất."
                  : "Enjoy the free time, or create a new task to get things moving."}
              </p>
              <motion.button
                whileHover={{ y: -3, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleOpenCreate}
                className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/30 transition-all text-sm"
              >
                + {t("tasks.create")}
              </motion.button>
            </motion.div>
          )}
        </div>

        {/* Modals */}
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          task={taskToEdit}
          categories={categories}
          onSave={handleSaveTask}
          onManageCategories={() => setIsCategoryModalOpen(true)}
        />

        <DeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          task={taskToDelete}
          onConfirm={handleDeleteConfirm}
        />

        <CategoryModal
          isOpen={isCategoryModalOpen}
          onClose={() => {
            setIsCategoryModalOpen(false);
            // Refresh categories when closing modal
            const fetchCategories = async () => {
              const data = await getCategories();
              if (data.success && data.data) setCategories(data.data);
            };
            fetchCategories();
          }}
        />

        <AIPlannerModal
          isOpen={isAIPlannerModalOpen}
          onClose={() => setIsAIPlannerModalOpen(false)}
          onPlanCreated={() => fetchTasks(true)}
        />

        <AIFilePlannerModal
          isOpen={isAIFilePlannerModalOpen}
          onClose={() => setIsAIFilePlannerModalOpen(false)}
          onPlanCreated={() => fetchTasks(true)}
        />
      </div>
    </Layout>
  );
};

export default MyTasks;
