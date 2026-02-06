import { useState, useEffect } from 'react';
import { Plus, ChevronDown, ChevronRight, CheckCircle2, Circle, Calendar, User, MessageSquare, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { API_URL } from '@/lib/api-url';
import { toast } from 'sonner';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  orderIndex: number;
  completedAt?: string;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  subtasks?: Subtask[];
}

interface Subtask {
  id: string;
  title: string;
  description?: string;
  status: string;
  orderIndex: number;
  dueDate?: string;
  completedAt?: string;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  comments?: SubtaskComment[];
}

interface SubtaskComment {
  id: string;
  comment: string;
  mentions: string[];
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

interface TasksTabProps {
  caseId: string;
}

export function TasksTab({ caseId }: TasksTabProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);
  const [showNewSubtaskDialog, setShowNewSubtaskDialog] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [staff, setStaff] = useState<any[]>([]);

  useEffect(() => {
    fetchTasks();
    fetchStaff();
  }, [caseId]);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/tasks?caseId=${caseId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const allTasks = await res.json();
        
        // Fetch subtasks for each task
        const tasksWithSubtasks = await Promise.all(
          allTasks.map(async (task: Task) => {
            const subtasksRes = await fetch(`${API_URL}/subtasks/task/${task.id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (subtasksRes.ok) {
              const subtasks = await subtasksRes.json();
              return { ...task, subtasks };
            }
            
            return { ...task, subtasks: [] };
          })
        );
        
        setTasks(tasksWithSubtasks.sort((a, b) => a.orderIndex - b.orderIndex));
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/staff`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setStaff(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const toggleTaskExpanded = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const createTask = async (data: any) => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...data, caseId })
      });
      
      if (res.ok) {
        toast.success('Task created successfully');
        fetchTasks();
        setShowNewTaskDialog(false);
      } else {
        toast.error('Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    }
  };

  const createSubtask = async (data: any) => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/subtasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...data, taskId: selectedTaskId })
      });
      
      if (res.ok) {
        const result = await res.json();
        if (result.invitedUser) {
          toast.success(`Subtask created & invite sent to ${data.assignedToEmail}`);
        } else {
          toast.success('Subtask created successfully');
        }
        fetchTasks();
        setShowNewSubtaskDialog(false);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to create subtask');
      }
    } catch (error) {
      console.error('Error creating subtask:', error);
      toast.error('Failed to create subtask');
    }
  };

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Check if all subtasks are completed
    const hasIncompleteSubtasks = task.subtasks?.some(st => st.status !== 'completed');
    
    if (currentStatus !== 'completed' && hasIncompleteSubtasks) {
      toast.error('Complete all subtasks before completing this task');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      
      const res = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        toast.success(`Task ${newStatus === 'completed' ? 'completed' : 'reopened'}`);
        fetchTasks();
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const toggleSubtaskStatus = async (subtaskId: string, currentStatus: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      
      const res = await fetch(`${API_URL}/subtasks/${subtaskId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        toast.success(`Subtask ${newStatus === 'completed' ? 'completed' : 'reopened'}`);
        fetchTasks();
      }
    } catch (error) {
      console.error('Error updating subtask:', error);
      toast.error('Failed to update subtask');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-warning text-warning-foreground';
      case 'medium': return 'bg-info text-info-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return <div className="p-6">Loading tasks...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Tasks</h2>
        <Dialog open={showNewTaskDialog} onOpenChange={setShowNewTaskDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <TaskForm onSubmit={createTask} staff={staff} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {tasks.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No tasks yet. Create your first task to get started.
            </CardContent>
          </Card>
        ) : (
          tasks.map((task) => (
            <Card key={task.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleTaskStatus(task.id, task.status)}
                    className="mt-1 flex-shrink-0"
                  >
                    {task.status === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className={`text-lg ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </CardTitle>
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {task.dueDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      
                      {task.assignedTo && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{task.assignedTo.name}</span>
                        </div>
                      )}
                      
                      {task.subtasks && task.subtasks.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span>
                            {task.subtasks.filter(st => st.status === 'completed').length}/{task.subtasks.length} subtasks
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {task.subtasks && task.subtasks.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleTaskExpanded(task.id)}
                    >
                      {expandedTasks.has(task.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
              
              {expandedTasks.has(task.id) && (
                <CardContent className="pt-0">
                  <Separator className="mb-4" />
                  
                  <div className="space-y-2 mb-4">
                    {task.subtasks?.map((subtask) => (
                      <div key={subtask.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <button
                          onClick={() => toggleSubtaskStatus(subtask.id, subtask.status)}
                          className="mt-0.5 flex-shrink-0"
                        >
                          {subtask.status === 'completed' ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                        
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${subtask.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                            {subtask.title}
                          </p>
                          
                          {subtask.description && (
                            <p className="text-xs text-muted-foreground mt-1">{subtask.description}</p>
                          )}
                          
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            {subtask.dueDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(subtask.dueDate).toLocaleDateString()}</span>
                              </div>
                            )}
                            
                            {subtask.assignedTo && (
                              <div className="flex items-center gap-1">
                                <Avatar className="h-4 w-4">
                                  <AvatarImage src={subtask.assignedTo.avatar} />
                                  <AvatarFallback>{subtask.assignedTo.name[0]}</AvatarFallback>
                                </Avatar>
                                <span>{subtask.assignedTo.name}</span>
                              </div>
                            )}
                            
                            {subtask.comments && subtask.comments.length > 0 && (
                              <div className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                <span>{subtask.comments.length}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTaskId(task.id);
                      setShowNewSubtaskDialog(true);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-2" />
                    Add Subtask
                  </Button>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      <Dialog open={showNewSubtaskDialog} onOpenChange={setShowNewSubtaskDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Subtask</DialogTitle>
          </DialogHeader>
          <SubtaskForm onSubmit={createSubtask} staff={staff} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TaskForm({ onSubmit, staff }: { onSubmit: (data: any) => void; staff: any[] }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assignedToId: '',
    dueDate: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="assignedTo">Assign To</Label>
          <Select value={formData.assignedToId} onValueChange={(value) => setFormData({ ...formData, assignedToId: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select staff" />
            </SelectTrigger>
            <SelectContent>
              {staff.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <Label htmlFor="dueDate">Due Date</Label>
        <Input
          id="dueDate"
          type="date"
          value={formData.dueDate}
          onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
        />
      </div>
      
      <div className="flex justify-end gap-2">
        <Button type="submit">Create Task</Button>
      </div>
    </form>
  );
}

function SubtaskForm({ onSubmit, staff }: { onSubmit: (data: any) => void; staff: any[] }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedToId: '',
    assignedToEmail: '',
    dueDate: ''
  });
  const [inviteMode, setInviteMode] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      assignedToId: inviteMode ? undefined : formData.assignedToId,
      assignedToEmail: inviteMode ? formData.assignedToEmail : undefined
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="subtask-title">Title *</Label>
        <Input
          id="subtask-title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="subtask-description">Description</Label>
        <Textarea
          id="subtask-description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={2}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="subtask-assignedTo">Assign To</Label>
          {inviteMode ? (
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Enter email to invite"
                value={formData.assignedToEmail}
                onChange={(e) => setFormData({ ...formData, assignedToEmail: e.target.value })}
              />
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => { setInviteMode(false); setFormData({ ...formData, assignedToEmail: '' }); }}
              >
                ← Select existing staff instead
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Select value={formData.assignedToId} onValueChange={(value) => setFormData({ ...formData, assignedToId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => { setInviteMode(true); setFormData({ ...formData, assignedToId: '' }); }}
              >
                + Invite someone by email
              </button>
            </div>
          )}
        </div>
        
        <div>
          <Label htmlFor="subtask-dueDate">Due Date</Label>
          <Input
            id="subtask-dueDate"
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          />
        </div>
      </div>
      
      <div className="flex justify-end gap-2">
        <Button type="submit">Create Subtask</Button>
      </div>
    </form>
  );
}
