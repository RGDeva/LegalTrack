import { useState, useRef, useEffect, useCallback } from "react";
import {
  Bot, Send, Loader2, Check, X, ChevronDown, Maximize2, Minimize2,
  AlertTriangle, Clock, FileText, Users, Briefcase, Receipt, Plus,
  ChevronRight, History, MessageSquare, CalendarDays
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { API_URL } from "@/lib/api-url";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface ProposedAction {
  type: string;
  entity: string;
  entityId?: string;
  fields: Record<string, any>;
  subtasks?: { title: string; dueOffset: number }[];
  summary: string;
  linkToCase?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  proposedActions?: ProposedAction[];
  appliedAt?: string | null;
  createdAt: string;
}

interface Conversation {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

const entityIcons: Record<string, any> = {
  time_entry: Clock,
  task: FileText,
  contact: Users,
  case: Briefcase,
  invoice: Receipt,
  runsheet: FileText,
  event: CalendarDays,
};

const quickPrompts = [
  { icon: Clock, label: "Log time", prompt: "Log 1.5 hrs for client consultation call" },
  { icon: FileText, label: "Create task", prompt: "Create tasks for discovery with subtasks and due dates" },
  { icon: CalendarDays, label: "Schedule", prompt: "Schedule hearing for client case on next Monday" },
  { icon: Users, label: "Add contact", prompt: "Add opposing counsel contact" },
  { icon: Receipt, label: "Invoice", prompt: "Create invoice draft" },
  { icon: Briefcase, label: "Help", prompt: "help" },
];

export function GlobalAiWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [applying, setApplying] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Cmd/Ctrl + K to toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => {
          if (!prev) setUnreadCount(0);
          return !prev;
        });
      }
      // Escape to close
      if (e.key === 'Escape' && open) {
        setOpen(false);
        setFullscreen(false);
        setShowHistory(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      loadConversations();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // On mobile, force fullscreen when open
  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth < 640 && open) {
        setFullscreen(true);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [open]);

  // Don't render if not logged in
  if (!user) return null;

  const loadConversations = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${API_URL}/ai/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  };

  const loadConversation = async (id: string) => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${API_URL}/ai/conversations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setActiveConversation(id);
        setShowHistory(false);
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
  };

  const startNewConversation = () => {
    setActiveConversation(null);
    setMessages([]);
    setShowHistory(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput("");
    setSending(true);

    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: msg,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${API_URL}/ai/actions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: msg,
          conversationId: activeConversation,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setActiveConversation(data.conversationId);
        const assistantMsg: Message = {
          id: data.messageId,
          role: "assistant",
          content: data.response,
          proposedActions: data.proposedActions,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== tempUserMsg.id),
          { ...tempUserMsg, id: `user-${Date.now()}` },
          assistantMsg,
        ]);
        loadConversations();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Failed to get response");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const applyActions = async (messageId: string, actions: ProposedAction[]) => {
    setApplying(messageId);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${API_URL}/ai/apply-actions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messageId, actions }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message);
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, appliedAt: new Date().toISOString() } : m))
        );
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Failed to apply actions");
      }
    } catch (error) {
      toast.error("Failed to apply actions");
    } finally {
      setApplying(null);
    }
  };

  const toggleOpen = () => {
    setOpen(!open);
    if (!open) setUnreadCount(0);
  };

  // Floating button when collapsed
  if (!open) {
    return (
      <button
        onClick={toggleOpen}
        className="fixed bottom-5 right-5 z-50 flex items-center justify-center h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 sm:bottom-6 sm:right-6"
        aria-label="Open AI Assistant"
      >
        <Bot className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
    );
  }

  // Panel dimensions
  const panelClasses = fullscreen
    ? "fixed inset-0 z-50"
    : "fixed bottom-5 right-5 z-50 w-[400px] h-[560px] sm:bottom-6 sm:right-6 rounded-xl shadow-2xl";

  return (
    <div className={cn(panelClasses, "bg-background border flex flex-col", fullscreen && "rounded-none")}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Bot className="h-5 w-5 text-primary shrink-0" />
          <span className="font-semibold text-sm truncate">AI Assistant</span>
          <Badge variant="outline" className="text-[10px] hidden sm:inline-flex shrink-0">Dry-run</Badge>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost" size="icon" className="h-7 w-7"
            onClick={() => setShowHistory(!showHistory)}
            title="Conversation history"
          >
            <History className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost" size="icon" className="h-7 w-7 hidden sm:flex"
            onClick={() => setFullscreen(!fullscreen)}
            title={fullscreen ? "Minimize" : "Maximize"}
          >
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost" size="icon" className="h-7 w-7"
            onClick={() => { setOpen(false); setFullscreen(false); setShowHistory(false); }}
            title="Close"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* History sidebar */}
        {showHistory && (
          <div className={cn(
            "border-r flex flex-col bg-muted/20 shrink-0",
            fullscreen ? "w-64" : "w-52"
          )}>
            <div className="p-2 border-b">
              <Button size="sm" className="w-full text-xs h-8" onClick={startNewConversation}>
                <Plus className="h-3 w-3 mr-1" /> New Chat
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-1.5 space-y-0.5">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => loadConversation(conv.id)}
                    className={cn(
                      "w-full text-left px-2.5 py-2 rounded-md text-xs transition-colors hover:bg-muted",
                      activeConversation === conv.id && "bg-muted font-medium"
                    )}
                  >
                    <p className="truncate">{conv.title || "New conversation"}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(conv.updatedAt).toLocaleDateString()}
                    </p>
                  </button>
                ))}
                {conversations.length === 0 && (
                  <p className="text-[10px] text-muted-foreground text-center py-6">No conversations yet</p>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          <ScrollArea className="flex-1 px-3 py-3">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full space-y-4 py-6">
                <div className="p-3 rounded-full bg-primary/10">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="font-semibold text-sm">LegalTrack AI</h3>
                  <p className="text-xs text-muted-foreground max-w-[260px]">
                    Manage cases, log time, create tasks, add contacts. All actions need your approval.
                  </p>
                </div>
                <div className={cn(
                  "grid gap-1.5 w-full px-2",
                  fullscreen ? "grid-cols-3 max-w-lg" : "grid-cols-2"
                )}>
                  {quickPrompts.map((qp, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(qp.prompt)}
                      className="flex items-center gap-1.5 p-2 rounded-lg border hover:bg-muted transition-colors text-left text-xs"
                    >
                      <qp.icon className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate">{qp.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className={cn("mx-auto", fullscreen && "max-w-2xl")}>
                {messages.map((msg) => (
                  <div key={msg.id} className={cn("mb-3", msg.role === "user" && "flex justify-end")}>
                    {msg.role === "user" ? (
                      <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-3 py-2 max-w-[85%]">
                        <p className="text-xs whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-w-[92%]">
                        <div className="flex items-start gap-1.5">
                          <div className="p-1 rounded-full bg-primary/10 mt-0.5 shrink-0">
                            <Bot className="h-3 w-3 text-primary" />
                          </div>
                          <div className="bg-muted rounded-2xl rounded-bl-sm px-3 py-2">
                            <div
                              className="text-xs whitespace-pre-wrap"
                              dangerouslySetInnerHTML={{
                                __html: msg.content
                                  .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                                  .replace(/\n/g, "<br/>"),
                              }}
                            />
                          </div>
                        </div>

                        {msg.proposedActions && msg.proposedActions.length > 0 && (
                          <div className="ml-6 space-y-1.5">
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              <span>Review before applying</span>
                            </div>
                            {msg.proposedActions.map((action, i) => {
                              const Icon = entityIcons[action.entity] || FileText;
                              return (
                                <div key={i} className="flex items-start gap-2 p-2 rounded-lg border bg-muted/30 text-xs">
                                  <Icon className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1 flex-wrap">
                                      <Badge variant="outline" className="text-[9px] h-4">{action.type}</Badge>
                                      <Badge variant="secondary" className="text-[9px] h-4">{action.entity.replace("_", " ")}</Badge>
                                    </div>
                                    <p className="mt-0.5 leading-snug">{action.summary}</p>
                                    {action.subtasks && (
                                      <div className="mt-1 text-muted-foreground">
                                        {action.subtasks.map((s, j) => (
                                          <div key={j} className="ml-1">{j + 1}. {s.title}</div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                            <div className="flex gap-1.5 pt-0.5">
                              {msg.appliedAt ? (
                                <Badge className="text-[10px] bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  <Check className="h-2.5 w-2.5 mr-0.5" /> Applied
                                </Badge>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    className="h-7 text-xs px-2.5"
                                    onClick={() => applyActions(msg.id, msg.proposedActions!)}
                                    disabled={applying === msg.id}
                                  >
                                    {applying === msg.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <><Check className="h-3 w-3 mr-1" /> Apply</>
                                    )}
                                  </Button>
                                  <Button
                                    size="sm" variant="outline" className="h-7 text-xs px-2.5"
                                    onClick={() => toast.info("Actions dismissed")}
                                  >
                                    <X className="h-3 w-3 mr-1" /> Dismiss
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {sending && (
                  <div className="flex items-center gap-1.5 mb-3">
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">Thinking...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="px-3 py-2.5 border-t shrink-0">
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
              className={cn("flex gap-2", fullscreen && "max-w-2xl mx-auto")}
            >
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask AI to log time, create tasks..."
                disabled={sending}
                className="text-sm h-9 flex-1"
              />
              <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={sending || !input.trim()}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
