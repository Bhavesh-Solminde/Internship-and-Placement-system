import React, { useEffect, useState, useRef, useCallback } from "react";
import { chatAPI, taskAPI } from "../../utils/api.js";
import { useAuthStore } from "../../store/useAuthStore.js";
import { useSocketStore } from "../../store/useSocketStore.js";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import {
  MessageCircle, Send, CheckCheck, Check, Clock, ClipboardList,
  ChevronRight, X, Upload, Link as LinkIcon, FileText, CheckCircle,
  ExternalLink, Paperclip, Loader2,
} from "lucide-react";

const StudentChat = () => {
  const { user, token } = useAuthStore();
  const { socket, connect, isConnected } = useSocketStore();
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [filter, setFilter] = useState("all"); // all | unread
  const [typing, setTyping] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  // Submission modal state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitTaskId, setSubmitTaskId] = useState(null);
  const [submitForm, setSubmitForm] = useState({ file: null, link: "", notes: "" });
  const [submitProgress, setSubmitProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

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
        if (msg.sender_role === "company") {
          socket.emit("mark_read", { applicationId: msg.application_id });
        }
      }
      setThreads((prev) =>
        prev.map((t) =>
          t.application_id === msg.application_id
            ? { ...t, last_message: msg.content, last_message_at: msg.created_at, last_message_role: msg.sender_role, unread_count: msg.sender_role === "company" && selectedThread?.application_id !== msg.application_id ? t.unread_count + 1 : t.unread_count }
            : t
        ).sort((a, b) => new Date(b.last_message_at || b.apply_date) - new Date(a.last_message_at || a.apply_date))
      );
    };

    const handleTyping = ({ role: r }) => {
      if (r === "company") setTyping(true);
    };
    const handleStopTyping = ({ role: r }) => {
      if (r === "company") setTyping(false);
    };
    const handleTaskAssigned = (task) => {
      setTasks((prev) => [task, ...prev]);
    };
    const handleTaskCompleted = (task) => {
      setTasks((prev) => prev.map((t) => t.task_id === task.task_id ? task : t));
    };
    const handleMessagesRead = ({ readBy }) => {
      if (readBy === "company") {
        setMessages((prev) => prev.map((m) => m.sender_role === "student" ? { ...m, is_read: true } : m));
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
    socket.on("task_assigned", handleTaskAssigned);
    socket.on("task_completed", handleTaskCompleted);
    socket.on("messages_read", handleMessagesRead);
    socket.on("status_updated", handleStatusUpdated);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("user_typing", handleTyping);
      socket.off("user_stop_typing", handleStopTyping);
      socket.off("task_assigned", handleTaskAssigned);
      socket.off("task_completed", handleTaskCompleted);
      socket.off("messages_read", handleMessagesRead);
      socket.off("status_updated", handleStatusUpdated);
    };
  }, [socket, selectedThread]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const selectThread = async (thread) => {
    setSelectedThread(thread);
    setMsgLoading(true);
    setMobileShowChat(true);

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

  // ── Submission modal logic ─────────────────────────────────────────
  const openSubmitModal = (taskId) => {
    setSubmitTaskId(taskId);
    setSubmitForm({ file: null, link: "", notes: "" });
    setSubmitProgress(0);
    setShowSubmitModal(true);
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    if (!submitTaskId) return;

    setIsSubmitting(true);
    setSubmitProgress(0);

    try {
      const formData = new FormData();
      if (submitForm.file) formData.append("file", submitForm.file);
      if (submitForm.link) formData.append("submission_link", submitForm.link);
      if (submitForm.notes) formData.append("submission_notes", submitForm.notes);

      const { data } = await taskAPI.complete(submitTaskId, formData);

      // Update local task state
      setTasks((prev) => prev.map((t) => t.task_id === submitTaskId ? data.data : t));
      setShowSubmitModal(false);
      setSubmitTaskId(null);
      setSubmitForm({ file: null, link: "", notes: "" });
    } catch (err) {
      console.error("Submission failed:", err);
      alert(err.response?.data?.message || "Failed to submit assignment");
    } finally {
      setIsSubmitting(false);
      setSubmitProgress(0);
    }
  };

  const formatTime = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
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

  const getStatusLabel = (thread) => {
    if (!thread) return null;
    const status = thread.status;
    if (["offered", "accepted", "shortlisted", "under_review"].includes(status)) return "In-touch";
    if (status === "expired") return "Expired";
    if (status === "rejected") return "Not selected";
    if (status === "withdrawn") return "Withdrawn";
    return "Applied";
  };

  const getStatusColor = (thread) => {
    const label = getStatusLabel(thread);
    if (label === "In-touch") return "text-blue-600";
    if (label === "Expired" || label === "Not selected") return "text-red-500";
    return "text-surface-500";
  };

  const filteredThreads = filter === "unread" ? threads.filter((t) => t.unread_count > 0) : threads;

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-surface-400">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ height: "calc(100vh - 64px)" }}>
      <div className="flex h-full max-w-7xl mx-auto">
        {/* ── Thread List (Left Panel) ────────────────────────── */}
        <div className={`w-full md:w-[380px] md:min-w-[380px] border-r border-surface-100 bg-white flex flex-col ${mobileShowChat ? "hidden md:flex" : "flex"}`}>
          {/* Filter tabs */}
          <div className="px-4 pt-4 pb-2 flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filter === "all" ? "bg-brand-600 text-white" : "bg-surface-100 text-surface-600 hover:bg-surface-200"}`}
            >
              All messages
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filter === "unread" ? "bg-brand-600 text-white" : "bg-surface-100 text-surface-600 hover:bg-surface-200"}`}
            >
              Unread ({threads.filter((t) => t.unread_count > 0).length})
            </button>
          </div>

          {/* Thread items */}
          <div className="flex-1 overflow-y-auto">
            {filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-surface-400 text-sm">
                {filter === "unread" ? "No unread messages" : "No conversations yet. Apply to internships or jobs to start chatting!"}
              </div>
            ) : (
              filteredThreads.map((thread) => (
                <div
                  key={thread.application_id}
                  onClick={() => selectThread(thread)}
                  className={`px-4 py-3 cursor-pointer border-b border-surface-50 transition-colors hover:bg-surface-50 ${selectedThread?.application_id === thread.application_id ? "bg-brand-50 border-l-4 border-l-brand-600" : ""}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-surface-900 text-sm truncate max-w-[200px]">
                      {thread.company_name}
                    </h3>
                    <span className="text-xs text-surface-400 whitespace-nowrap ml-2">
                      {thread.last_message_at ? formatDate(thread.last_message_at) : formatDate(thread.apply_date)}
                    </span>
                  </div>
                  <p className="text-xs text-surface-500 mb-1">
                    {thread.internship_title || thread.job_title}
                  </p>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-surface-400 truncate max-w-[220px]">
                      {thread.last_message_role === "student" && "You: "}
                      {thread.last_message || "No messages yet"}
                    </p>
                    {thread.unread_count > 0 && (
                      <span className="ml-2 w-5 h-5 bg-brand-600 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                        {thread.unread_count}
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 flex items-center gap-1">
                    <span className={`text-xs font-medium ${getStatusColor(thread)}`}>
                      {getStatusLabel(thread) === "In-touch" && <span className="inline-block mr-0.5">↔</span>}
                      {getStatusLabel(thread)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Chat Area (Right Panel) ─────────────────────────── */}
        <div className={`flex-1 flex flex-col bg-surface-50 ${!mobileShowChat ? "hidden md:flex" : "flex"}`}>
          {!selectedThread ? (
            <div className="flex-1 flex flex-col items-center justify-center text-surface-400">
              <MessageCircle className="w-16 h-16 mb-4 text-surface-200" />
              <p className="text-lg font-medium text-surface-500">Select a conversation</p>
              <p className="text-sm">Choose a chat from the left to start messaging</p>
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
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-surface-900 truncate">{selectedThread.company_name}</h2>
                  <p className="text-xs text-surface-500 truncate">
                    {selectedThread.internship_title || selectedThread.job_title}
                    {" · "}
                    Chatting with {selectedThread.company_name}
                  </p>
                </div>
                <StatusBadge status={selectedThread.status} />
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
                    <p className="text-sm">No messages yet. Say hello!</p>
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

                    const isOwn = item.sender_role === "student";
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
                          <div className={`flex items-center gap-1 mt-1 ${isOwn && !isTaskMsg ? "justify-end" : "justify-end"}`}>
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

                {/* Task cards */}
                {tasks.filter((t) => t.status === "pending").length > 0 && (
                  <div className="my-4 space-y-2">
                    {tasks.filter((t) => t.status === "pending").map((task) => (
                      <div key={task.task_id} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <ClipboardList className="w-4 h-4 text-amber-600" />
                          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Pending Task</span>
                        </div>
                        <h4 className="font-semibold text-surface-900 text-sm">{task.title}</h4>
                        {task.description && <p className="text-xs text-surface-600 mt-1">{task.description}</p>}
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-surface-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Deadline: {new Date(task.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                          <button
                            onClick={() => openSubmitModal(task.task_id)}
                            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                          >
                            <Upload className="w-3 h-3" />
                            Submit Assignment
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Submitted task cards */}
                {tasks.filter((t) => t.status === "completed").length > 0 && (
                  <div className="my-4 space-y-2">
                    {tasks.filter((t) => t.status === "completed").map((task) => (
                      <div key={task.task_id} className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-xs font-semibold text-green-700 uppercase tracking-wider">Submitted</span>
                        </div>
                        <h4 className="font-semibold text-surface-900 text-sm">{task.title}</h4>
                        {/* Show submission details */}
                        <div className="mt-2 space-y-1">
                          {task.submission_file_url && (
                            <a
                              href={task.submission_file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 text-xs text-brand-600 hover:underline"
                            >
                              <Paperclip className="w-3 h-3" />
                              View submitted file
                            </a>
                          )}
                          {task.submission_link && (
                            <a
                              href={task.submission_link}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 text-xs text-brand-600 hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {task.submission_link}
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
              {selectedThread.status !== "expired" && selectedThread.status !== "rejected" ? (
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
                <div className="bg-surface-50 border-t border-surface-100 px-4 py-3 text-center text-sm text-surface-500">
                  {selectedThread.status === "expired"
                    ? "This application has expired. You can no longer send messages."
                    : "Unfortunately, you can't message the employer anymore, since your application has not been selected."}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Submit Assignment Modal ───────────────────────────────── */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-float w-full max-w-md mx-4 animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
              <h3 className="font-semibold text-surface-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-brand-600" />
                Submit Assignment
              </h3>
              <button
                onClick={() => { setShowSubmitModal(false); setSubmitTaskId(null); }}
                className="p-1 hover:bg-surface-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitAssignment} className="p-6 space-y-4">
              {/* File upload */}
              <div>
                <label className="label">Attach File</label>
                <div
                  className="border-2 border-dashed border-surface-200 rounded-xl p-4 text-center cursor-pointer hover:border-brand-400 hover:bg-brand-50/30 transition-all"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.zip,.rar,.doc,.docx"
                    className="hidden"
                    onChange={(e) => setSubmitForm({ ...submitForm, file: e.target.files[0] || null })}
                  />
                  {submitForm.file ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="w-5 h-5 text-brand-600" />
                      <span className="text-sm font-medium text-surface-900">{submitForm.file.name}</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setSubmitForm({ ...submitForm, file: null }); }}
                        className="text-surface-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 text-surface-300 mx-auto mb-2" />
                      <p className="text-sm text-surface-500">Click to upload</p>
                      <p className="text-xs text-surface-400 mt-0.5">PDF, Images, ZIP — max 10 MB</p>
                    </div>
                  )}
                </div>
                {/* Upload progress */}
                {isSubmitting && submitProgress > 0 && (
                  <div className="mt-2">
                    <div className="w-full bg-surface-100 rounded-full h-1.5">
                      <div className="bg-brand-600 h-1.5 rounded-full transition-all" style={{ width: `${submitProgress}%` }} />
                    </div>
                    <p className="text-xs text-surface-400 mt-1">{submitProgress}% uploaded</p>
                  </div>
                )}
              </div>

              {/* URL field */}
              <div>
                <label className="label">External Link (optional)</label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    type="url"
                    value={submitForm.link}
                    onChange={(e) => setSubmitForm({ ...submitForm, link: e.target.value })}
                    placeholder="https://github.com/your-repo"
                    className="input-field !pl-10"
                  />
                </div>
              </div>

              {/* Notes field */}
              <div>
                <label className="label">Notes (optional)</label>
                <textarea
                  value={submitForm.notes}
                  onChange={(e) => setSubmitForm({ ...submitForm, notes: e.target.value })}
                  placeholder="Describe what you've built or any notes for the reviewer..."
                  className="input-field"
                  rows={3}
                />
              </div>

              {/* Submit button */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowSubmitModal(false); setSubmitTaskId(null); }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Submit
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentChat;
