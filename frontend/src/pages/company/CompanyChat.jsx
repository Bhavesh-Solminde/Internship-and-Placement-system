import React, { useEffect, useState, useRef } from "react";
import { chatAPI, taskAPI } from "../../utils/api.js";
import { useAuthStore } from "../../store/useAuthStore.js";
import { useSocketStore } from "../../store/useSocketStore.js";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import {
  MessageCircle, Send, CheckCheck, Check, Clock, ClipboardList,
  X, User, Mail, Phone, MapPin, ExternalLink, GitBranch, Globe,
  Download, GraduationCap, Briefcase, AlertTriangle, ChevronRight, Timer, Plus,
  CheckCircle, Paperclip, ChevronDown,
} from "lucide-react";

const CompanyChat = () => {
  const { user, token } = useAuthStore();
  const { socket, connect, isConnected } = useSocketStore();
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [typing, setTyping] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: "", description: "", deadline: "" });
  const [taskSubmitting, setTaskSubmitting] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  // Status update state (Change 2)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusToast, setStatusToast] = useState(null);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Connect socket on mount
  useEffect(() => {
    if (token) connect(token);
  }, [token]);

  // Load threads
  useEffect(() => {
    chatAPI.getThreads()
      .then(({ data }) => setThreads(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      if (selectedThread && msg.application_id === selectedThread.application_id) {
        setMessages((prev) => {
          if (prev.some((m) => m.message_id === msg.message_id)) return prev;
          return [...prev, msg];
        });
        if (msg.sender_role === "student") {
          socket.emit("mark_read", { applicationId: msg.application_id });
        }
      }
      setThreads((prev) =>
        prev.map((t) =>
          t.application_id === msg.application_id
            ? { ...t, last_message: msg.content, last_message_at: msg.created_at, last_message_role: msg.sender_role, unread_count: msg.sender_role === "student" && selectedThread?.application_id !== msg.application_id ? t.unread_count + 1 : t.unread_count }
            : t
        ).sort((a, b) => new Date(b.last_message_at || b.apply_date) - new Date(a.last_message_at || a.apply_date))
      );
    };

    const handleTyping = ({ role: r }) => {
      if (r === "student") setTyping(true);
    };
    const handleStopTyping = ({ role: r }) => {
      if (r === "student") setTyping(false);
    };
    const handleTaskCompleted = (task) => {
      setTasks((prev) => prev.map((t) => t.task_id === task.task_id ? task : t));
    };
    const handleMessagesRead = ({ readBy }) => {
      if (readBy === "student") {
        setMessages((prev) => prev.map((m) => m.sender_role === "company" ? { ...m, is_read: true } : m));
      }
    };
    const handleStatusUpdated = ({ applicationId, status }) => {
      setThreads((prev) =>
        prev.map((t) => t.application_id === applicationId ? { ...t, status } : t)
      );
      if (selectedThread?.application_id === applicationId) {
        setSelectedThread((prev) => prev ? { ...prev, status } : prev);
      }
    };

    socket.on("new_message", handleNewMessage);
    socket.on("user_typing", handleTyping);
    socket.on("user_stop_typing", handleStopTyping);
    socket.on("task_completed", handleTaskCompleted);
    socket.on("messages_read", handleMessagesRead);
    socket.on("status_updated", handleStatusUpdated);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("user_typing", handleTyping);
      socket.off("user_stop_typing", handleStopTyping);
      socket.off("task_completed", handleTaskCompleted);
      socket.off("messages_read", handleMessagesRead);
      socket.off("status_updated", handleStatusUpdated);
    };
  }, [socket, selectedThread]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // Auto-dismiss toast
  useEffect(() => {
    if (statusToast) {
      const t = setTimeout(() => setStatusToast(null), 3500);
      return () => clearTimeout(t);
    }
  }, [statusToast]);

  const selectThread = async (thread) => {
    setSelectedThread(thread);
    setMsgLoading(true);
    setMobileShowChat(true);
    setShowStatusDropdown(false);
    setPendingStatus(null);

    if (selectedThread && socket) {
      socket.emit("leave_chat", { applicationId: selectedThread.application_id });
    }

    try {
      const [msgRes, taskRes] = await Promise.all([
        chatAPI.getMessages(thread.application_id),
        taskAPI.getByApp(thread.application_id),
      ]);
      setMessages(msgRes.data.data);
      setTasks(taskRes.data.data);

      if (socket) {
        socket.emit("join_chat", { applicationId: thread.application_id });
        socket.emit("mark_read", { applicationId: thread.application_id });
      }

      await chatAPI.markRead(thread.application_id);
      setThreads((prev) =>
        prev.map((t) => t.application_id === thread.application_id ? { ...t, unread_count: 0 } : t)
      );
    } catch (err) {
      console.error(err);
    } finally {
      setMsgLoading(false);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !selectedThread) return;

    socket.emit("send_message", {
      applicationId: selectedThread.application_id,
      content: newMessage.trim(),
    });
    setNewMessage("");
    socket.emit("stop_typing", { applicationId: selectedThread.application_id });
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (socket && selectedThread) {
      socket.emit("typing", { applicationId: selectedThread.application_id });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stop_typing", { applicationId: selectedThread.application_id });
      }, 2000);
    }
  };

  const assignTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title || !taskForm.deadline) return;
    setTaskSubmitting(true);
    try {
      const { data } = await taskAPI.create({
        application_id: selectedThread.application_id,
        title: taskForm.title,
        description: taskForm.description,
        deadline: taskForm.deadline,
      });
      setTasks((prev) => [data.data, ...prev]);
      setShowTaskModal(false);
      setTaskForm({ title: "", description: "", deadline: "" });

      setThreads((prev) =>
        prev.map((t) => t.application_id === selectedThread.application_id ? { ...t, last_activity_at: new Date().toISOString() } : t)
      );
    } catch (err) {
      console.error(err);
    } finally {
      setTaskSubmitting(false);
    }
  };

  // ── Status update logic (Change 2) ────────────────────────────────
  const handleStatusSelect = (newStatus) => {
    setPendingStatus(newStatus);
    setShowStatusDropdown(false);
  };

  const confirmStatusUpdate = async () => {
    if (!pendingStatus || !selectedThread) return;
    setStatusUpdating(true);
    try {
      await taskAPI.updateStatus(selectedThread.application_id, pendingStatus);

      // Update local state
      const updatedThread = { ...selectedThread, status: pendingStatus, last_activity_at: new Date().toISOString() };
      setSelectedThread(updatedThread);
      setThreads((prev) =>
        prev.map((t) => t.application_id === selectedThread.application_id ? { ...t, status: pendingStatus, last_activity_at: new Date().toISOString() } : t)
      );

      // Show toast for accepted/rejected
      if (pendingStatus === "accepted" || pendingStatus === "rejected") {
        setStatusToast({ type: pendingStatus, message: `Application ${pendingStatus === "accepted" ? "accepted" : "rejected"} — ${selectedThread.student_name}` });
      }

      setPendingStatus(null);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update status");
    } finally {
      setStatusUpdating(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────
  const getDaysRemaining = (thread) => {
    if (!thread?.last_activity_at) return 45;
    const lastActivity = new Date(thread.last_activity_at);
    const expiryDate = new Date(lastActivity.getTime() + 45 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diff = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const getExpiryColor = (days) => {
    if (days <= 5) return "text-red-600 bg-red-50 border-red-200";
    if (days <= 15) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-surface-500 bg-surface-50 border-surface-200";
  };

  const formatTime = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "long" });
  };

  const getDateGroups = (msgs) => {
    const groups = [];
    let lastDate = null;
    msgs.forEach((msg) => {
      const dateStr = new Date(msg.created_at).toDateString();
      if (dateStr !== lastDate) {
        groups.push({ type: "date", date: formatDate(msg.created_at) });
        lastDate = dateStr;
      }
      groups.push({ type: "message", ...msg });
    });
    return groups;
  };

  const statusOptions = [
    { value: "under_review", label: "Under Review", color: "text-blue-600 bg-blue-50" },
    { value: "shortlisted", label: "Shortlisted", color: "text-purple-600 bg-purple-50" },
    { value: "offered", label: "Offered", color: "text-amber-600 bg-amber-50" },
    { value: "accepted", label: "Accepted", color: "text-green-600 bg-green-50" },
    { value: "rejected", label: "Rejected", color: "text-red-600 bg-red-50" },
  ];

  const filteredThreads = filter === "unread" ? threads.filter((t) => t.unread_count > 0) : threads;

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-surface-400">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ height: "calc(100vh - 64px)" }}>
      <div className="flex h-full max-w-7xl mx-auto">
        {/* ── Thread List (Left Panel) ────────────────────────── */}
        <div className={`w-full md:w-[380px] md:min-w-[380px] border-r border-surface-100 bg-white flex flex-col ${mobileShowChat ? "hidden md:flex" : "flex"}`}>
          <div className="px-4 pt-4 pb-2 flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filter === "all" ? "bg-brand-600 text-white" : "bg-surface-100 text-surface-600 hover:bg-surface-200"}`}
            >
              All applications
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filter === "unread" ? "bg-brand-600 text-white" : "bg-surface-100 text-surface-600 hover:bg-surface-200"}`}
            >
              Unread ({threads.filter((t) => t.unread_count > 0).length})
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-surface-400 text-sm">
                {filter === "unread" ? "No unread messages" : "No applications to show."}
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const days = getDaysRemaining(thread);
                const isTerminal = ["accepted", "rejected", "withdrawn", "expired"].includes(thread.status);

                return (
                  <div
                    key={thread.application_id}
                    onClick={() => selectThread(thread)}
                    className={`px-4 py-3 cursor-pointer border-b border-surface-50 transition-colors hover:bg-surface-50 ${selectedThread?.application_id === thread.application_id ? "bg-brand-50 border-l-4 border-l-brand-600" : ""}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {thread.student_name?.charAt(0)}
                        </div>
                        <h3 className="font-semibold text-surface-900 text-sm truncate">
                          {thread.student_name}
                        </h3>
                      </div>
                      <span className="text-xs text-surface-400 whitespace-nowrap ml-2">
                        {thread.last_message_at ? formatDate(thread.last_message_at) : formatDate(thread.apply_date)}
                      </span>
                    </div>
                    <p className="text-xs text-surface-500 mb-1 ml-10">
                      {thread.internship_title || thread.job_title}
                    </p>
                    <div className="flex justify-between items-center ml-10">
                      <p className="text-xs text-surface-400 truncate max-w-[180px]">
                        {thread.last_message_role === "company" && "You: "}
                        {thread.last_message || "No messages yet"}
                      </p>
                      {thread.unread_count > 0 && (
                        <span className="ml-2 w-5 h-5 bg-brand-600 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                          {thread.unread_count}
                        </span>
                      )}
                    </div>
                    {/* Expiry countdown + status */}
                    <div className="mt-1.5 ml-10 flex items-center gap-2">
                      <StatusBadge status={thread.status} />
                      {!isTerminal && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 ${getExpiryColor(days)}`}>
                          <Timer className="w-3 h-3" />
                          {days}d left
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Chat Area (Center) ──────────────────────────────── */}
        <div className={`flex-1 flex flex-col bg-surface-50 min-w-0 ${!mobileShowChat ? "hidden md:flex" : "flex"}`}>
          {!selectedThread ? (
            <div className="flex-1 flex flex-col items-center justify-center text-surface-400">
              <MessageCircle className="w-16 h-16 mb-4 text-surface-200" />
              <p className="text-lg font-medium text-surface-500">Select a conversation</p>
              <p className="text-sm">Choose an applicant to start chatting</p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="bg-white border-b border-surface-100 px-4 py-3 flex items-center gap-3">
                <button
                  onClick={() => setMobileShowChat(false)}
                  className="md:hidden p-1 hover:bg-surface-100 rounded-lg"
                >
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                <div
                  className="w-9 h-9 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer"
                  onClick={() => setShowProfile(!showProfile)}
                >
                  {selectedThread.student_name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-surface-900 truncate">{selectedThread.student_name}</h2>
                  <p className="text-xs text-surface-500 truncate">
                    {selectedThread.internship_title || selectedThread.job_title}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowTaskModal(true)}
                    className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1"
                    title="Assign Task"
                  >
                    <ClipboardList className="w-4 h-4" />
                    <span className="hidden sm:inline">Assign Task</span>
                  </button>
                  <button
                    onClick={() => setShowProfile(!showProfile)}
                    className="btn-ghost !px-2.5"
                    title="View Profile"
                  >
                    <User className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {msgLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-pulse text-surface-400">Loading messages...</div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-surface-400">
                    <MessageCircle className="w-12 h-12 mb-3 text-surface-200" />
                    <p className="text-sm">No messages yet. Send a message to the student!</p>
                  </div>
                ) : (
                  getDateGroups(messages).map((item, idx) => {
                    if (item.type === "date") {
                      return (
                        <div key={`date-${idx}`} className="flex justify-center my-4">
                          <span className="bg-surface-200 text-surface-600 text-xs px-3 py-1 rounded-full font-medium">
                            {item.date}
                          </span>
                        </div>
                      );
                    }

                    const isOwn = item.sender_role === "company";
                    const isTaskMsg = item.content.startsWith("📋 Task assigned:") || item.content.startsWith("✅ Task completed:");
                    const isStatusMsg = item.content.startsWith("📌 Application status");

                    return (
                      <div key={item.message_id} className={`flex mb-3 ${isOwn ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                            isTaskMsg
                              ? "bg-blue-50 border border-blue-200 text-surface-800"
                              : isStatusMsg
                              ? "bg-purple-50 border border-purple-200 text-surface-800"
                              : isOwn
                              ? "bg-brand-600 text-white rounded-br-md"
                              : "bg-white border border-surface-100 text-surface-800 rounded-bl-md shadow-soft"
                          }`}
                        >
                          {isTaskMsg && (
                            <div className="flex items-center gap-1.5 mb-1">
                              <ClipboardList className="w-3.5 h-3.5 text-blue-600" />
                              <span className="text-xs font-semibold text-blue-600">
                                {item.content.startsWith("📋") ? "Task Assigned" : "Task Completed"}
                              </span>
                            </div>
                          )}
                          {isStatusMsg && (
                            <div className="flex items-center gap-1.5 mb-1">
                              <CheckCircle className="w-3.5 h-3.5 text-purple-600" />
                              <span className="text-xs font-semibold text-purple-600">Status Update</span>
                            </div>
                          )}
                          <p className="text-sm whitespace-pre-wrap break-words">{item.content}</p>
                          <div className="flex items-center gap-1 mt-1 justify-end">
                            <span className={`text-xs ${isOwn && !isTaskMsg && !isStatusMsg ? "text-white/70" : "text-surface-400"}`}>
                              {formatTime(item.created_at)}
                            </span>
                            {isOwn && !isTaskMsg && !isStatusMsg && (
                              item.is_read
                                ? <CheckCheck className="w-3.5 h-3.5 text-white/70" />
                                : <Check className="w-3.5 h-3.5 text-white/70" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Tasks overview */}
                {tasks.length > 0 && (
                  <div className="my-4 space-y-2">
                    {tasks.map((task) => (
                      <div key={task.task_id} className={`rounded-xl p-3 border ${task.status === "completed" ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ClipboardList className={`w-4 h-4 ${task.status === "completed" ? "text-green-600" : "text-amber-600"}`} />
                            <span className="text-sm font-medium text-surface-900">{task.title}</span>
                          </div>
                          <StatusBadge status={task.status} />
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-surface-500">
                          <Clock className="w-3 h-3" />
                          <span>Due: {new Date(task.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                        </div>
                        {/* Submission details for company */}
                        {task.status === "completed" && (
                          <div className="mt-2 pt-2 border-t border-green-200 space-y-1">
                            {task.submission_file_url && (
                              <a href={task.submission_file_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-brand-600 hover:underline">
                                <Paperclip className="w-3 h-3" />View submitted file
                              </a>
                            )}
                            {task.submission_link && (
                              <a href={task.submission_link} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-brand-600 hover:underline">
                                <ExternalLink className="w-3 h-3" />{task.submission_link}
                              </a>
                            )}
                            {task.submission_notes && (
                              <p className="text-xs text-surface-600 italic">"{task.submission_notes}"</p>
                            )}
                            {task.submitted_at && (
                              <p className="text-xs text-surface-400">
                                Submitted on {new Date(task.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Typing indicator */}
                {typing && (
                  <div className="flex justify-start mb-3">
                    <div className="bg-white border border-surface-100 rounded-2xl rounded-bl-md px-4 py-2.5 shadow-soft">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              {selectedThread.status !== "expired" ? (
                <form onSubmit={sendMessage} className="bg-white border-t border-surface-100 px-4 py-3 flex items-center gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={handleInputChange}
                    placeholder="Write a message..."
                    className="input-field flex-1"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="btn-primary !px-4 !py-2.5"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <div className="bg-red-50 border-t border-red-200 px-4 py-3 text-center text-sm text-red-600 flex items-center justify-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  This application has expired due to inactivity.
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Student Profile Sidebar (Right) ─────────────────── */}
        {showProfile && selectedThread && (
          <div className="w-[320px] min-w-[320px] border-l border-surface-100 bg-white overflow-y-auto hidden lg:block animate-slide-in-right">
            <div className="p-4 border-b border-surface-100 flex items-center justify-between">
              <h3 className="font-semibold text-surface-900">Student Profile</h3>
              <button onClick={() => setShowProfile(false)} className="p-1 hover:bg-surface-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Avatar + Name */}
              <div className="text-center">
                <div className="w-16 h-16 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-2">
                  {selectedThread.student_name?.charAt(0)}
                </div>
                <h4 className="font-semibold text-surface-900">{selectedThread.student_name}</h4>
                {selectedThread.cgpa && (
                  <p className="text-sm text-surface-500">CGPA: {selectedThread.cgpa}/10</p>
                )}
              </div>

              {/* ── Status Update (Change 2) ──────────────────── */}
              <div>
                <h5 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Application Status</h5>
                <div className="flex items-center gap-2 mb-2">
                  <StatusBadge status={selectedThread.status} />
                </div>

                {!["expired", "withdrawn"].includes(selectedThread.status) && (
                  <div className="relative">
                    <button
                      onClick={() => { setShowStatusDropdown(!showStatusDropdown); setPendingStatus(null); }}
                      className="w-full flex items-center justify-between px-3 py-2 bg-surface-50 border border-surface-200 rounded-lg text-sm text-surface-700 hover:bg-surface-100 transition-colors"
                    >
                      <span>Update Status</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${showStatusDropdown ? "rotate-180" : ""}`} />
                    </button>

                    {showStatusDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-surface-200 rounded-lg shadow-lg z-10 py-1 animate-fade-in">
                        {statusOptions
                          .filter((opt) => opt.value !== selectedThread.status)
                          .map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => handleStatusSelect(opt.value)}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-50 transition-colors ${opt.color.split(" ")[0]}`}
                            >
                              {opt.label}
                            </button>
                          ))}
                      </div>
                    )}

                    {/* Inline confirmation */}
                    {pendingStatus && (
                      <div className="mt-2 p-2.5 bg-surface-50 border border-surface-200 rounded-lg animate-fade-in">
                        <p className="text-xs text-surface-600 mb-2">
                          Change status to <span className="font-semibold">{statusOptions.find((o) => o.value === pendingStatus)?.label}</span>?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setPendingStatus(null)}
                            className="flex-1 text-xs px-2 py-1.5 rounded-lg bg-surface-100 text-surface-600 hover:bg-surface-200 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={confirmStatusUpdate}
                            disabled={statusUpdating}
                            className="flex-1 text-xs px-2 py-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-50"
                          >
                            {statusUpdating ? "Updating..." : "Confirm"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Contact */}
              <div>
                <h5 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Contact</h5>
                <div className="space-y-1.5">
                  {selectedThread.student_email && (
                    <a href={`mailto:${selectedThread.student_email}`} className="flex items-center gap-2 text-sm text-brand-600 hover:underline">
                      <Mail className="w-3.5 h-3.5" />{selectedThread.student_email}
                    </a>
                  )}
                  {selectedThread.student_phone && (
                    <p className="flex items-center gap-2 text-sm text-surface-700">
                      <Phone className="w-3.5 h-3.5" />{selectedThread.student_phone}
                    </p>
                  )}
                  {selectedThread.student_location && (
                    <p className="flex items-center gap-2 text-sm text-surface-700">
                      <MapPin className="w-3.5 h-3.5" />{selectedThread.student_location}
                    </p>
                  )}
                </div>
              </div>

              {/* Links */}
              <div className="flex flex-wrap gap-2">
                {selectedThread.linkedin_url && (
                  <a href={selectedThread.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded-full">
                    <ExternalLink className="w-3 h-3" />LinkedIn
                  </a>
                )}
                {selectedThread.github_url && (
                  <a href={selectedThread.github_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-surface-700 hover:underline bg-surface-100 px-2 py-1 rounded-full">
                    <GitBranch className="w-3 h-3" />GitHub
                  </a>
                )}
                {selectedThread.portfolio_url && (
                  <a href={selectedThread.portfolio_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-purple-600 hover:underline bg-purple-50 px-2 py-1 rounded-full">
                    <Globe className="w-3 h-3" />Portfolio
                  </a>
                )}
              </div>

              {/* Skills */}
              {selectedThread.skills?.length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Skills</h5>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedThread.skills.map((s) => (
                      <span key={s} className="px-2 py-0.5 bg-brand-100 text-brand-700 rounded-full text-xs font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {Array.isArray(selectedThread.education) && selectedThread.education.length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5" />Education
                  </h5>
                  {selectedThread.education.map((edu, i) => (
                    <div key={i} className="text-xs text-surface-700 mb-1">
                      <span className="font-medium">{edu.degree}</span> {edu.field && `in ${edu.field}`}
                      {edu.institution && ` — ${edu.institution}`}
                    </div>
                  ))}
                </div>
              )}

              {/* Experience */}
              {selectedThread.experience_years > 0 && (
                <div>
                  <h5 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5" />Experience
                  </h5>
                  <p className="text-xs text-surface-700">{selectedThread.experience_years} year(s)</p>
                </div>
              )}

              {/* Resume */}
              {selectedThread.resume_url && (
                <a
                  href={`${import.meta.env.VITE_API_URL || "http://localhost:5001"}${selectedThread.resume_url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-surface-100 hover:bg-surface-200 rounded-lg text-sm font-medium transition-colors w-full"
                >
                  <Download className="w-4 h-4" /> Download Resume
                </a>
              )}

              {/* Expiry Info */}
              {!["accepted", "rejected", "withdrawn", "expired"].includes(selectedThread.status) && (
                <div className={`p-3 rounded-xl border ${getExpiryColor(getDaysRemaining(selectedThread))}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Timer className="w-4 h-4" />
                    <span className="text-sm font-semibold">Application Expiry</span>
                  </div>
                  <p className="text-xs">
                    {getDaysRemaining(selectedThread)} days remaining before auto-expiry.
                    Send a message or assign a task to reset the timer.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Task Assignment Modal ─────────────────────────────── */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-float w-full max-w-md mx-4 animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
              <h3 className="font-semibold text-surface-900 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-brand-600" />
                Assign Task
              </h3>
              <button onClick={() => setShowTaskModal(false)} className="p-1 hover:bg-surface-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={assignTask} className="p-6 space-y-4">
              <div>
                <label className="label">Title *</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="e.g., Complete coding assessment"
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Provide details about the task..."
                  className="input-field"
                  rows={3}
                />
              </div>
              <div>
                <label className="label">Deadline *</label>
                <input
                  type="datetime-local"
                  value={taskForm.deadline}
                  onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={taskSubmitting}
                  className="btn-primary flex-1"
                >
                  {taskSubmitting ? "Assigning..." : "Assign Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Status Toast Notification ────────────────────────── */}
      {statusToast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-float border animate-slide-up ${
          statusToast.type === "accepted"
            ? "bg-green-50 border-green-200 text-green-800"
            : "bg-red-50 border-red-200 text-red-800"
        }`}>
          {statusToast.type === "accepted"
            ? <CheckCircle className="w-5 h-5 text-green-600" />
            : <AlertTriangle className="w-5 h-5 text-red-600" />
          }
          <span className="text-sm font-medium">{statusToast.message}</span>
          <button onClick={() => setStatusToast(null)} className="ml-2 p-0.5 hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default CompanyChat;
