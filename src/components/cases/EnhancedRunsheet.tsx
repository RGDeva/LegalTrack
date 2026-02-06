import { useState, useEffect, useRef } from 'react';
import { Plus, Clock, FileText, MessageSquare, CheckCircle, ListTodo, Timer, Send, ChevronDown, ChevronRight, AtSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { API_URL } from '@/lib/api-url';
import { toast } from 'sonner';

interface RunsheetComment {
  id: string;
  comment: string;
  userName?: string;
  userId: string;
  mentions: string[];
  createdAt: string;
  parentId?: string;
  replies?: RunsheetComment[];
}

interface RunsheetEntry {
  id: string;
  type: string;
  title: string;
  description?: string;
  userId?: string;
  userName?: string;
  metadata?: any;
  createdAt: string;
  source: string;
  comments?: RunsheetComment[];
}

interface EnhancedRunsheetProps {
  caseId: string;
}

export function EnhancedRunsheet({ caseId }: EnhancedRunsheetProps) {
  const [entries, setEntries] = useState<RunsheetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewEntryDialog, setShowNewEntryDialog] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [staff, setStaff] = useState<any[]>([]);

  useEffect(() => {
    fetchRunsheet();
    fetchStaff();
  }, [caseId]);

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/staff`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setStaff(Array.isArray(data) ? data : []); }
    } catch (e) { console.error('Error fetching staff:', e); }
  };

  const toggleComments = (entryId: string) => {
    const next = new Set(expandedComments);
    next.has(entryId) ? next.delete(entryId) : next.add(entryId);
    setExpandedComments(next);
  };

  const parseMentions = (text: string): string[] => {
    const matches = text.match(/@(\w+)/g);
    if (!matches) return [];
    return matches.map(m => {
      const name = m.slice(1).toLowerCase();
      const found = staff.find(s => s.name?.toLowerCase().includes(name));
      return found?.id;
    }).filter(Boolean);
  };

  const submitComment = async (entryId: string, parentId?: string) => {
    const text = commentText[entryId + (parentId || '')];
    if (!text?.trim()) return;
    try {
      const token = localStorage.getItem('authToken');
      const mentions = parseMentions(text);
      const res = await fetch(`${API_URL}/runsheet/${entryId}/comments`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: text, mentions, parentId })
      });
      if (res.ok) {
        toast.success('Comment added');
        setCommentText(prev => ({ ...prev, [entryId + (parentId || '')]: '' }));
        fetchRunsheet();
      } else { toast.error('Failed to add comment'); }
    } catch (e) { console.error('Error adding comment:', e); toast.error('Failed to add comment'); }
  };

  const fetchRunsheet = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/runsheet/case/${caseId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch (error) {
      console.error('Error fetching runsheet:', error);
      toast.error('Failed to load runsheet');
    } finally {
      setLoading(false);
    }
  };

  const createManualEntry = async (data: { title: string; description: string }) => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/runsheet`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...data, caseId })
      });
      
      if (res.ok) {
        toast.success('Entry added successfully');
        fetchRunsheet();
        setShowNewEntryDialog(false);
      } else {
        toast.error('Failed to add entry');
      }
    } catch (error) {
      console.error('Error creating entry:', error);
      toast.error('Failed to add entry');
    }
  };

  const getEntryIcon = (type: string) => {
    switch (type) {
      case 'time_entry':
        return <Timer className="h-4 w-4" />;
      case 'task_created':
      case 'task_completed':
        return <ListTodo className="h-4 w-4" />;
      case 'subtask_completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4" />;
      case 'manual':
        return <FileText className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getEntryColor = (type: string) => {
    switch (type) {
      case 'time_entry':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'task_created':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-400';
      case 'task_completed':
      case 'subtask_completed':
        return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'comment':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'manual':
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatEntryType = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const filteredEntries = filterType === 'all' 
    ? entries 
    : entries.filter(entry => entry.type === filterType);

  if (loading) {
    return <div className="p-6">Loading runsheet...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Case Activity Log</h2>
          <p className="text-sm text-muted-foreground">
            Unified timeline of all case activities, time entries, and updates
          </p>
        </div>
        <Dialog open={showNewEntryDialog} onOpenChange={setShowNewEntryDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Entry
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Manual Entry</DialogTitle>
            </DialogHeader>
            <ManualEntryForm onSubmit={createManualEntry} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filterType === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterType('all')}
        >
          All
        </Button>
        <Button
          variant={filterType === 'time_entry' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterType('time_entry')}
        >
          Time Entries
        </Button>
        <Button
          variant={filterType === 'task_created' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterType('task_created')}
        >
          Tasks
        </Button>
        <Button
          variant={filterType === 'comment' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterType('comment')}
        >
          Comments
        </Button>
        <Button
          variant={filterType === 'manual' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterType('manual')}
        >
          Manual
        </Button>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {filteredEntries.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No activity yet. Start by adding time entries or creating tasks.
            </CardContent>
          </Card>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border" />
            
            <div className="space-y-6">
              {filteredEntries.map((entry, index) => (
                <div key={entry.id} className="relative flex gap-4">
                  {/* Timeline dot */}
                  <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background ${getEntryColor(entry.type)}`}>
                    {getEntryIcon(entry.type)}
                  </div>
                  
                  {/* Entry content */}
                  <Card className="flex-1">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {formatEntryType(entry.type)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(entry.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <CardTitle className="text-base">{entry.title}</CardTitle>
                        </div>
                        
                        {entry.userName && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback>{entry.userName[0]}</AvatarFallback>
                            </Avatar>
                            <span>{entry.userName}</span>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    
                    {(entry.description || entry.metadata) && (
                      <CardContent className="pt-0">
                        {entry.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {entry.description}
                          </p>
                        )}
                        
                        {entry.metadata && entry.type === 'time_entry' && (
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Duration: {entry.metadata.durationMinutes} min</span>
                            <span>Amount: ${(entry.metadata.amountCents / 100).toFixed(2)}</span>
                            {entry.metadata.billingCode && (
                              <Badge variant="secondary" className="text-xs">
                                {entry.metadata.billingCode}
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        {entry.metadata && (entry.type === 'task_created' || entry.type === 'task_completed' || entry.type === 'subtask_completed') && (
                          <div className="text-xs text-muted-foreground">
                            {entry.metadata.taskTitle && (
                              <span>Task: {entry.metadata.taskTitle}</span>
                            )}
                          </div>
                        )}
                      </CardContent>
                    )}

                    {/* Comment Thread Toggle & Inline */}
                    {entry.source === 'runsheet' && (
                      <div className="px-6 pb-4">
                        <button
                          onClick={() => toggleComments(entry.id)}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {expandedComments.has(entry.id) ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                          <MessageSquare className="h-3 w-3" />
                          <span>{entry.comments?.length || 0} comment{(entry.comments?.length || 0) !== 1 ? 's' : ''}</span>
                        </button>

                        {expandedComments.has(entry.id) && (
                          <div className="mt-3 space-y-3">
                            {entry.comments && entry.comments.length > 0 && (
                              <div className="space-y-2 pl-4 border-l-2 border-muted">
                                {entry.comments.map((c) => (
                                  <div key={c.id} className="text-sm">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{c.userName || 'User'}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(c.createdAt).toLocaleString()}
                                      </span>
                                      {c.mentions && c.mentions.length > 0 && (
                                        <AtSign className="h-3 w-3 text-primary" />
                                      )}
                                    </div>
                                    <p className="text-muted-foreground">{c.comment}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="flex gap-2">
                              <Input
                                value={commentText[entry.id] || ''}
                                onChange={(e) => setCommentText(prev => ({ ...prev, [entry.id]: e.target.value }))}
                                placeholder="Add a comment... Use @name to mention"
                                className="h-8 text-sm"
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(entry.id); } }}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-2"
                                onClick={() => submitComment(entry.id)}
                                disabled={!commentText[entry.id]?.trim()}
                              >
                                <Send className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ManualEntryForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ title: '', description: '' });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="entry-title">Title *</Label>
        <Input
          id="entry-title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Client meeting, Court filing"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="entry-description">Description</Label>
        <Textarea
          id="entry-description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Add details about this activity..."
          rows={4}
        />
      </div>
      
      <div className="flex justify-end gap-2">
        <Button type="submit">Add Entry</Button>
      </div>
    </form>
  );
}
