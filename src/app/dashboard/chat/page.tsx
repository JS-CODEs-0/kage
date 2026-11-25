"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Send,
  Plus,
  Trash2,
  Copy,
  Check,
  Bookmark,
  Calendar,
  AlertCircle,
  Building2,
  ExternalLink,
  MessageSquare,
  StopCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { MarkdownRenderer } from "@/components/chat/MarkdownRenderer";
import type { BrandProfile } from "../brand/page";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

const quickPromptStarters = [
  {
    icon: "⚡",
    title: "Viral Hook Engineering",
    prompt: "Generate 5 high-converting, scroll-stopping hooks tailored to my brand and niche. Include visual cues and psychology breakdowns.",
  },
  {
    icon: "📅",
    title: "7-Day Content Roadmap",
    prompt: "Architect a 7-day multi-platform social media calendar for my brand with exact posting themes, hooks, and calls-to-action.",
  },
  {
    icon: "🎬",
    title: "30s Reel Screenplay",
    prompt: "Write a high-retention 30-second video reel script with audio direction, camera cues, text-on-screen, and spoken voiceover.",
  },
  {
    icon: "🔍",
    title: "Brand Voice Audit",
    prompt: "Audit my current brand positioning and value proposition. Provide 3 high-leverage recommendations to increase audience authority.",
  },
];

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [inputPrompt, setInputPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [savedVaultId, setSavedVaultId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load Brand Profile & Sessions on mount
  useEffect(() => {
    try {
      const storedBrand = localStorage.getItem("socialpilot_brand_profile");
      if (storedBrand) {
        setBrandProfile(JSON.parse(storedBrand));
      }

      const storedSessions = localStorage.getItem("socialpilot_chat_sessions");
      const storedActiveId = localStorage.getItem("socialpilot_active_chat_id");

      if (storedSessions) {
        const parsed: ChatSession[] = JSON.parse(storedSessions);
        setSessions(parsed);
        if (parsed.length > 0) {
          const current = parsed.find((s) => s.id === storedActiveId) || parsed[0];
          setActiveSessionId(current.id);
        } else {
          initNewSession();
        }
      } else {
        initNewSession();
      }
    } catch {
      initNewSession();
    }
  }, []);

  // Sync sessions to localStorage
  const saveSessions = (updated: ChatSession[], newActiveId?: string) => {
    setSessions(updated);
    try {
      localStorage.setItem("socialpilot_chat_sessions", JSON.stringify(updated));
      if (newActiveId) {
        setActiveSessionId(newActiveId);
        localStorage.setItem("socialpilot_active_chat_id", newActiveId);
      }
    } catch {
      // LocalStorage fallback
    }
  };

  const initNewSession = () => {
    const newSession: ChatSession = {
      id: `session_${Date.now()}`,
      title: "New Strategy Counsel",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    const updated = [newSession, ...sessions];
    saveSessions(updated, newSession.id);
    setErrorMessage(null);
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0] || null;

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages, isGenerating]);

  // Handle textarea resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputPrompt]);

  const handleDeleteSession = (idToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter((s) => s.id !== idToDelete);
    if (updated.length === 0) {
      const freshSession: ChatSession = {
        id: `session_${Date.now()}`,
        title: "New Strategy Counsel",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      };
      saveSessions([freshSession], freshSession.id);
    } else {
      const nextActiveId = activeSessionId === idToDelete ? updated[0].id : activeSessionId || updated[0].id;
      saveSessions(updated, nextActiveId);
    }
  };

  const handleClearAllSessions = () => {
    if (confirm("Are you sure you want to clear all chat sessions?")) {
      const freshSession: ChatSession = {
        id: `session_${Date.now()}`,
        title: "New Strategy Counsel",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      };
      saveSessions([freshSession], freshSession.id);
    }
  };

  const handleClearCurrentChat = () => {
    if (!activeSession) return;
    const updated = sessions.map((s) =>
      s.id === activeSession.id
        ? { ...s, messages: [], updatedAt: new Date().toISOString() }
        : s
    );
    saveSessions(updated, activeSession.id);
    setErrorMessage(null);
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputPrompt).trim();
    if (!textToSend || isGenerating) return;

    if (!activeSession) {
      initNewSession();
      return;
    }

    setErrorMessage(null);
    setInputPrompt("");

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: textToSend,
      createdAt: new Date().toISOString(),
    };

    const isFirstMessage = activeSession.messages.length === 0;
    const generatedTitle = isFirstMessage
      ? textToSend.slice(0, 32).trim() + (textToSend.length > 32 ? "..." : "")
      : activeSession.title;

    const assistantPlaceholderId = `msg_${Date.now() + 1}`;
    const assistantMessage: Message = {
      id: assistantPlaceholderId,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
    };

    const newMessages = [...activeSession.messages, userMessage, assistantMessage];
    const updatedSessions = sessions.map((s) =>
      s.id === activeSession.id
        ? {
            ...s,
            title: generatedTitle,
            updatedAt: new Date().toISOString(),
            messages: newMessages,
          }
        : s
    );
    setSessions(updatedSessions);
    setIsGenerating(true);

    abortControllerRef.current = new AbortController();

    try {
      const conversationHistory = [...activeSession.messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: conversationHistory,
          brandProfile: brandProfile || undefined,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${res.statusText}`);
      }

      if (!res.body) {
        throw new Error("No response body received from server.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let streamedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data:")) continue;

          const dataStr = trimmed.slice(5).trim();
          if (dataStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.error) {
              throw new Error(parsed.error);
            }
            if (parsed.content) {
              streamedContent += parsed.content;

              setSessions((prevSessions) =>
                prevSessions.map((s) => {
                  if (s.id !== activeSession.id) return s;
                  const msgs = s.messages.map((m) =>
                    m.id === assistantPlaceholderId
                      ? { ...m, content: streamedContent }
                      : m
                  );
                  return { ...s, messages: msgs };
                })
              );
            }
          } catch {
            // Buffer fragment
          }
        }
      }

      // Final save to localStorage
      setSessions((currentSessions) => {
        try {
          localStorage.setItem("socialpilot_chat_sessions", JSON.stringify(currentSessions));
        } catch {
          // ignore
        }
        return currentSessions;
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        // User deliberately aborted
      } else {
        const msg = err instanceof Error ? err.message : "Failed to synthesize response.";
        setErrorMessage(msg);
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleCopyMessage = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(id);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch {
      // Fallback
    }
  };

  const handleSaveToVault = (text: string, msgId: string) => {
    try {
      const existing = localStorage.getItem("socialpilot_saved_posts");
      const list = existing ? JSON.parse(existing) : [];

      const newPost = {
        id: `post_${Date.now()}`,
        mode: "ideas",
        topic: activeSession?.title || "AI Assistant Counsel",
        tone: brandProfile?.brandTone || "Viral & Punchy",
        content: text,
        createdAt: new Date().toISOString(),
      };

      const updated = [newPost, ...list];
      localStorage.setItem("socialpilot_saved_posts", JSON.stringify(updated));
      setSavedVaultId(msgId);
      setTimeout(() => setSavedVaultId(null), 2500);
    } catch {
      setErrorMessage("Failed to save post to Vault.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Kage Section Header */}
      <div className="kage-sec-head">
        <span className="k"><b>06</b> — The Counsel Chamber</span>
        <span className="kage-rule" />
        <span className="k kage-jp">対話</span>
      </div>

      {/* Main Two-Column Chat Container */}
      <div className="kage-card border border-line-soft flex h-[calc(100vh-210px)] min-h-[580px] overflow-hidden relative">
        {/* Left Sessions Sidebar */}
        <div
          className={`${
            sidebarOpen ? "w-72" : "w-0 -translate-x-full"
          } transition-all duration-300 ease-in-out border-r border-line-soft bg-ink-2/95 flex flex-col justify-between shrink-0 overflow-hidden z-20 absolute md:relative inset-y-0 left-0`}
        >
          <div className="flex flex-col h-full">
            {/* Sidebar Action Bar */}
            <div className="p-4 border-b border-line-soft space-y-3">
              <button
                onClick={initNewSession}
                className="w-full kage-cta kage-cta--vermilion text-[10px] tracking-[0.2em] uppercase py-2 px-3 flex items-center justify-center gap-2"
              >
                <Plus className="w-3.5 h-3.5 text-vermilion" />
                <span>New Strategy Counsel</span>
              </button>

              <div className="flex items-center justify-between text-[9px] tracking-[0.22em] uppercase text-muted px-1">
                <span>Archives ({sessions.length})</span>
                {sessions.length > 1 && (
                  <button
                    onClick={handleClearAllSessions}
                    className="hover:text-vermilion transition-colors"
                    title="Clear all sessions"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {sessions.map((session) => {
                const isActive = session.id === activeSessionId;
                return (
                  <div
                    key={session.id}
                    onClick={() => {
                      setActiveSessionId(session.id);
                      localStorage.setItem("socialpilot_active_chat_id", session.id);
                    }}
                    className={`group flex items-center justify-between px-3 py-2.5 text-xs transition-all cursor-pointer border-l-2 ${
                      isActive
                        ? "border-vermilion bg-line-soft text-bone font-medium"
                        : "border-transparent text-bone-dim hover:text-bone hover:bg-ink-3/60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <MessageSquare
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive ? "text-vermilion" : "text-muted group-hover:text-bone-dim"
                        }`}
                      />
                      <span className="truncate text-[11px] tracking-wide">
                        {session.title || "Untitled Counsel"}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleDeleteSession(session.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-vermilion transition-opacity shrink-0 ml-1"
                      title="Delete session"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Sidebar Footnote */}
            <div className="p-3 border-t border-line-soft text-[9px] tracking-[0.2em] uppercase text-muted text-center">
              <span>Local Persistent Storage</span>
            </div>
          </div>
        </div>

        {/* Right Active Chat Workspace */}
        <div className="flex-1 flex flex-col justify-between bg-ink relative min-w-0">
          {/* Top Chat Header */}
          <div className="h-14 px-4 sm:px-6 border-b border-line-soft flex items-center justify-between bg-ink-2/60 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 border border-line-soft hover:border-line text-muted hover:text-bone transition-colors"
                title={sidebarOpen ? "Collapse archives" : "Expand archives"}
              >
                {sidebarOpen ? (
                  <ChevronLeft className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>

              <div className="min-w-0">
                <h3 className="kage-display text-xs sm:text-sm tracking-wider text-bone truncate">
                  {activeSession?.title || "Strategy Counsel"}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {brandProfile?.businessName ? (
                <Link
                  href="/dashboard/brand"
                  className="hidden sm:inline-flex items-center gap-1.5 text-[9px] tracking-[0.18em] uppercase text-bone-dim hover:text-bone px-2.5 py-1 border border-line-soft hover:border-line transition-all"
                >
                  <Building2 className="w-3 h-3 text-vermilion" />
                  <span className="truncate max-w-[120px]">{brandProfile.businessName}</span>
                </Link>
              ) : (
                <Link
                  href="/dashboard/brand"
                  className="hidden sm:inline-flex items-center gap-1 text-[9px] tracking-[0.18em] uppercase text-muted hover:text-bone-dim px-2 py-1 border border-line-soft"
                >
                  <span>No Blueprint</span>
                  <ExternalLink className="w-2.5 h-2.5 text-vermilion" />
                </Link>
              )}

              <button
                onClick={handleClearCurrentChat}
                className="kage-cta py-1 px-2.5 text-[9px] tracking-[0.18em] uppercase text-muted hover:text-bone"
                title="Clear current messages"
              >
                <RefreshCw className="w-3 h-3" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
            {/* Empty State / Welcome Screen */}
            {activeSession && activeSession.messages.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-center max-w-2xl mx-auto py-8 space-y-6">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-full border border-vermilion/40 bg-vermilion/10 flex items-center justify-center mx-auto text-vermilion">
                    <Sparkles className="w-6 h-6 stroke-[1.4]" />
                  </div>
                  <h2 className="kage-display text-lg sm:text-xl text-bone">
                    The Sanctuary Counsel is Ready
                  </h2>
                  <p className="text-xs sm:text-[13px] font-light text-bone-dim leading-relaxed max-w-md mx-auto">
                    Direct SocialPilot&apos;s Master AI Strategist. Brainstorm viral hooks, engineer multi-platform content roadmaps, and refine high-converting copy powered by Nemotron 3 Ultra 550B.
                  </p>
                </div>

                {/* Quick Action Prompt Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left pt-2">
                  {quickPromptStarters.map((starter, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(starter.prompt)}
                      className="p-3.5 border border-line-soft bg-ink-2/60 hover:bg-ink-3 hover:border-line transition-all flex flex-col justify-between group"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-sm">{starter.icon}</span>
                        <span className="text-[11px] font-medium tracking-wide text-bone group-hover:text-vermilion transition-colors">
                          {starter.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted font-light leading-relaxed line-clamp-2">
                        {starter.prompt}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              activeSession?.messages.map((message) => {
                const isUser = message.role === "user";
                return (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 sm:gap-4 ${
                      isUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    {!isUser && (
                      <div className="w-7 h-7 shrink-0 rounded-none border border-vermilion/60 bg-vermilion/10 flex items-center justify-center text-vermilion font-medium text-[10px] kage-jp mt-0.5 shadow-[0_0_12px_rgba(224,35,28,0.3)]">
                        対話
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] sm:max-w-[80%] rounded-none p-4 sm:p-5 transition-all ${
                        isUser
                          ? "bg-ink-3 border border-line text-bone font-light text-xs sm:text-[13px] leading-relaxed"
                          : "bg-ink-2/90 border border-line-soft text-bone"
                      }`}
                    >
                      {isUser ? (
                        <div className="whitespace-pre-wrap font-sans">{message.content}</div>
                      ) : (
                        <div className="space-y-3">
                          <MarkdownRenderer content={message.content} />

                          {/* Assistant Action Ribbon */}
                          {message.content && (
                            <div className="pt-2 mt-3 border-t border-line-soft flex items-center justify-between text-[10px] tracking-widest uppercase text-muted">
                              <span className="text-[9px]">Nemotron 3 Ultra 550B</span>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleCopyMessage(message.id, message.content)}
                                  className="flex items-center gap-1 px-2 py-1 hover:text-bone text-muted border border-line-soft hover:border-line transition-all"
                                  title="Copy response"
                                >
                                  {copiedMessageId === message.id ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span className="text-emerald-400">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  onClick={() => handleSaveToVault(message.content, message.id)}
                                  className="flex items-center gap-1 px-2 py-1 hover:text-bone text-muted border border-line-soft hover:border-line transition-all"
                                  title="Save to Vault"
                                >
                                  {savedVaultId === message.id ? (
                                    <>
                                      <Check className="w-3 h-3 text-vermilion" />
                                      <span className="text-vermilion">Vaulted</span>
                                    </>
                                  ) : (
                                    <>
                                      <Bookmark className="w-3 h-3" />
                                      <span>Vault</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Pulsing Streaming Indicator */}
            {isGenerating && (
              <div className="flex items-center gap-3 text-xs text-bone-dim pl-1">
                <div className="w-2 h-2 rounded-full bg-vermilion animate-ping" />
                <span className="font-light text-[11px] tracking-wider text-muted uppercase">
                  Nemotron streaming neural synthesis...
                </span>
              </div>
            )}

            {/* Error Notification */}
            {errorMessage && (
              <div className="p-3 border border-vermilion/40 bg-vermilion/10 text-vermilion text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Fixed Input Chamber */}
          <div className="p-4 sm:p-5 border-t border-line-soft bg-ink-2/95">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative flex items-end gap-2"
            >
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={
                  brandProfile?.businessName
                    ? `Instruct AI Strategist for ${brandProfile.businessName}... (Shift+Enter for newline)`
                    : "Ask for viral hooks, caption rewrites, weekly strategies, reel scripts... (Shift+Enter for newline)"
                }
                className="w-full px-4 py-3 bg-ink border border-line-soft text-xs sm:text-[13px] text-bone placeholder:text-muted/50 focus:outline-none focus:border-vermilion transition-colors resize-none rounded-none leading-relaxed max-h-44"
              />

              <div className="shrink-0 flex items-center gap-2">
                {isGenerating ? (
                  <button
                    type="button"
                    onClick={handleStopGenerating}
                    className="kage-cta kage-cta--vermilion py-3 px-4 text-[10px] tracking-widest uppercase flex items-center gap-1.5"
                    title="Stop generation"
                  >
                    <StopCircle className="w-3.5 h-3.5 text-vermilion" />
                    <span className="hidden sm:inline">Halt</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!inputPrompt.trim()}
                    className="kage-cta kage-cta--vermilion py-3 px-4 text-[10px] tracking-widest uppercase disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5 text-vermilion" />
                    <span className="hidden sm:inline">Transmit</span>
                  </button>
                )}
              </div>
            </form>

            {/* Input Footer Status */}
            <div className="mt-2.5 flex items-center justify-between text-[9px] tracking-[0.2em] uppercase text-muted px-1">
              <span>NVIDIA Nemotron 3 Ultra 550B Architecture</span>
              <span>
                {brandProfile?.businessName ? (
                  <span className="text-bone-dim">Active Voice: {brandProfile.businessName}</span>
                ) : (
                  <span>Universal Context</span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
