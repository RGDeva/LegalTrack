import { useState, useRef, useEffect } from "react";
import { Bot, Send, Loader2, Check, X, ChevronDown, ChevronUp, AlertTriangle, Clock, FileText, Users, Briefcase, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  proposedActions?: ProposedAction[];
  appliedAt?: string | null;
  createdAt: string;
}

const entityIcons: Record<string, any> = {
  time_entry: Clock,
  task: FileText,
  contact: Users,
  case: Briefcase,
  invoice: Receipt,
  runsheet: FileText,
};

interface CaseAiPanelProps {
  caseId: string;
  caseNumber: string;
}

export function CaseAiPanel({ caseId, caseNumber }: CaseAiPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [applying, setApplying] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (expanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [messages, expanded]);

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
      const res = await fetch(`${API_URL}/ai/actions-openai`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: msg,
          conversationId,
          caseId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setConversationId(data.conversationId);
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

  if (!expanded) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setExpanded(true)}
          className="rounded-full h-14 w-14 shadow-lg"
          size="icon"
        >
          <Bot className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 h-[500px] bg-background border rounded-xl shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30 rounded-t-xl">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">AI Assistant</span>
          <Badge variant="outline" className="text-[10px]">Case #{caseNumber}</Badge>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(false)}>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-3 py-2">
        {messages.length === 0 && (
          <div className="text-center py-8 space-y-2">
            <Bot className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Ask me to log time, create tasks, update this case, or add runsheet entries.
            </p>
            <div className="space-y-1">
              {[
                "Log 0.5 hrs for reviewing documents",
                "Create tasks for discovery with subtasks",
                "Add note: Filed motion for summary judgment",
              ].map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
                  className="block w-full text-left text-xs px-2 py-1.5 rounded hover:bg-muted transition-colors text-muted-foreground"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`mb-3 ${msg.role === "user" ? "flex justify-end" : ""}`}>
            {msg.role === "user" ? (
              <div className="bg-primary text-primary-foreground rounded-xl rounded-br-sm px-3 py-1.5 max-w-[85%]">
                <p className="text-xs whitespace-pre-wrap">{msg.content}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="bg-muted rounded-xl rounded-bl-sm px-3 py-1.5 max-w-[90%]">
                  <div
                    className="text-xs whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{
                      __html: msg.content
                        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                        .replace(/\n/g, "<br/>"),
                    }}
                  />
                </div>
                {msg.proposedActions && msg.proposedActions.length > 0 && (
                  <div className="space-y-1.5 ml-1">
                    {msg.proposedActions.map((action, i) => {
                      const Icon = entityIcons[action.entity] || FileText;
                      return (
                        <div key={i} className="flex items-start gap-2 p-2 rounded border bg-muted/30 text-xs">
                          <Icon className="h-3 w-3 mt-0.5 text-primary shrink-0" />
                          <span>{action.summary}</span>
                        </div>
                      );
                    })}
                    <div className="flex gap-1.5">
                      {msg.appliedAt ? (
                        <Badge className="text-[10px] bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <Check className="h-2.5 w-2.5 mr-0.5" /> Applied
                        </Badge>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            className="h-6 text-[10px] px-2"
                            onClick={() => applyActions(msg.id, msg.proposedActions!)}
                            disabled={applying === msg.id}
                          >
                            {applying === msg.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <><Check className="h-2.5 w-2.5 mr-0.5" /> Apply</>
                            )}
                          </Button>
                          <Button size="sm" variant="outline" className="h-6 text-[10px] px-2">
                            <X className="h-2.5 w-2.5 mr-0.5" /> Dismiss
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
      </ScrollArea>

      {/* Input */}
      <div className="px-3 py-2 border-t">
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
          className="flex gap-1.5"
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the AI assistant..."
            disabled={sending}
            className="text-xs h-8"
          />
          <Button type="submit" size="icon" className="h-8 w-8 shrink-0" disabled={sending || !input.trim()}>
            {sending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
