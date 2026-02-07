import { useState, useEffect, useRef } from "react";
import { Bot, Send, Loader2, Check, X, History, Plus, ChevronRight, AlertTriangle, FileText, Clock, Users, Briefcase, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { API_URL } from "@/lib/api-url";

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
  caseId: string | null;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
}

const quickPrompts = [
  { icon: Clock, label: "Log time", prompt: "Log 1.5 hrs for client consultation call" },
  { icon: FileText, label: "Create tasks", prompt: "Create tasks for discovery with subtasks and due dates" },
  { icon: Users, label: "Add contact", prompt: "Add opposing counsel contact " },
  { icon: Receipt, label: "Create invoice", prompt: "Create invoice draft" },
  { icon: Briefcase, label: "Update case", prompt: "Set status to pending" },
];

const entityIcons: Record<string, any> = {
  time_entry: Clock,
  task: FileText,
  contact: Users,
  case: Briefcase,
  invoice: Receipt,
  runsheet: FileText,
};

const AiAssistant = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [applying, setApplying] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
  };

  const startNewConversation = () => {
    setActiveConversation(null);
    setMessages([]);
    inputRef.current?.focus();
  };

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput("");
    setSending(true);

    // Optimistic add
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
        setMessages((prev) => [...prev.filter((m) => m.id !== tempUserMsg.id), { ...tempUserMsg, id: `user-${Date.now()}` }, assistantMsg]);
        loadConversations();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Failed to get response");
      }
    } catch (error) {
      console.error("Error sending message:", error);
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
        // Mark message as applied
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, appliedAt: new Date().toISOString() } : m))
        );
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Failed to apply actions");
      }
    } catch (error) {
      console.error("Error applying actions:", error);
      toast.error("Failed to apply actions");
    } finally {
      setApplying(null);
    }
  };

  const renderActionCard = (action: ProposedAction, index: number) => {
    const Icon = entityIcons[action.entity] || FileText;
    return (
      <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border">
        <div className="p-1.5 rounded bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">{action.type}</Badge>
            <Badge variant="secondary" className="text-xs">{action.entity.replace("_", " ")}</Badge>
          </div>
          <p className="text-sm mt-1">{action.summary}</p>
          {action.fields && (
            <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
              {Object.entries(action.fields)
                .filter(([, v]) => v != null && v !== "")
                .slice(0, 5)
                .map(([k, v]) => (
                  <div key={k}>
                    <span className="font-medium">{k}:</span> {String(v)}
                  </div>
                ))}
            </div>
          )}
          {action.subtasks && (
            <div className="mt-2 text-xs space-y-0.5">
              <span className="font-medium text-muted-foreground">Subtasks:</span>
              {action.subtasks.map((s, i) => (
                <div key={i} className="ml-2 text-muted-foreground">
                  {i + 1}. {s.title} <span className="text-muted-foreground/60">(+{s.dueOffset}d)</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMessage = (msg: Message) => {
    if (msg.role === "user") {
      return (
        <div key={msg.id} className="flex justify-end mb-4">
          <div className="max-w-[80%] bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2.5">
            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
          </div>
        </div>
      );
    }

    return (
      <div key={msg.id} className="flex justify-start mb-4">
        <div className="max-w-[85%] space-y-3">
          <div className="flex items-start gap-2">
            <div className="p-1.5 rounded-full bg-primary/10 mt-0.5">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2.5">
              <div className="text-sm whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{
                  __html: msg.content
                    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                    .replace(/\n/g, "<br/>")
                    .replace(/• /g, "• "),
                }}
              />
            </div>
          </div>

          {msg.proposedActions && msg.proposedActions.length > 0 && (
            <div className="ml-8 space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertTriangle className="h-3 w-3" />
                <span>Proposed actions — review before applying</span>
              </div>
              {msg.proposedActions.map((action, i) => renderActionCard(action, i))}
              <div className="flex gap-2 pt-1">
                {msg.appliedAt ? (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <Check className="h-3 w-3 mr-1" /> Applied
                  </Badge>
                ) : (
                  <>
                    <Button
                      size="sm"
                      onClick={() => applyActions(msg.id, msg.proposedActions!)}
                      disabled={applying === msg.id}
                    >
                      {applying === msg.id ? (
                        <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Applying...</>
                      ) : (
                        <><Check className="h-3 w-3 mr-1" /> Apply Actions</>
                      )}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toast.info("Actions dismissed")}>
                      <X className="h-3 w-3 mr-1" /> Dismiss
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      {showSidebar && (
        <div className="w-72 border-r flex flex-col bg-muted/30">
          <div className="p-4 border-b">
            <Button className="w-full" onClick={startNewConversation}>
              <Plus className="h-4 w-4 mr-2" /> New Chat
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => loadConversation(conv.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors hover:bg-muted ${
                    activeConversation === conv.id ? "bg-muted font-medium" : ""
                  }`}
                >
                  <p className="truncate">{conv.title || "New conversation"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(conv.updatedAt).toLocaleDateString()}
                  </p>
                </button>
              ))}
              {conversations.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No conversations yet</p>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Main Chat */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-3 border-b">
          <Button variant="ghost" size="icon" onClick={() => setShowSidebar(!showSidebar)}>
            <History className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">AI Assistant</h1>
          </div>
          <Badge variant="outline" className="ml-auto text-xs">Dry-run mode — actions require confirmation</Badge>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-6 py-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-8 py-12">
              <div className="text-center space-y-2">
                <div className="p-4 rounded-full bg-primary/10 inline-block">
                  <Bot className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">LegalTrack AI Assistant</h2>
                <p className="text-muted-foreground max-w-md">
                  I can help you manage cases, log time, create tasks, add contacts, and more.
                  All actions require your approval before being applied.
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl">
                {quickPrompts.map((qp, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(qp.prompt);
                      inputRef.current?.focus();
                    }}
                    className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted transition-colors text-left text-sm"
                  >
                    <qp.icon className="h-4 w-4 text-primary shrink-0" />
                    <span>{qp.label}</span>
                    <ChevronRight className="h-3 w-3 ml-auto text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">
              {messages.map(renderMessage)}
              {sending && (
                <div className="flex justify-start mb-4">
                  <div className="flex items-center gap-2 bg-muted rounded-2xl px-4 py-2.5">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="px-6 py-4 border-t">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-2 max-w-3xl mx-auto"
          >
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Try "Log 1.5 hrs for client call" or "Create tasks for discovery"...'
              disabled={sending}
              className="flex-1"
            />
            <Button type="submit" disabled={sending || !input.trim()}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AiAssistant;
