import { useState, useEffect } from 'react';
import { Plus, Calendar as CalendarIcon, Clock, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Deadline } from '@/types';
import { toast } from 'sonner';

export function CalendarView() {
  const [events, setEvents] = useState<Deadline[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    caseId: '',
    dueDate: '',
    assignee: ''
  });

  useEffect(() => {
    // Load events from localStorage
    const savedEvents = localStorage.getItem('calendarEvents');
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents));
    }
  }, []);

  const saveEvents = (newEvents: Deadline[]) => {
    localStorage.setItem('calendarEvents', JSON.stringify(newEvents));
    setEvents(newEvents);
  };

  const handleAddDeadline = () => {
    if (!formData.title || !formData.caseId || !formData.dueDate || !formData.assignee) {
      toast.error('Please fill in all fields');
      return;
    }

    const newEvent: Deadline = {
      id: Date.now().toString(),
      caseId: formData.caseId,
      title: formData.title,
      dueDate: formData.dueDate,
      assignee: formData.assignee,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const updatedEvents = [...events, newEvent];
    saveEvents(updatedEvents);
    
    toast.success('Deadline added successfully');
    setShowAddDialog(false);
    setFormData({ title: '', caseId: '', dueDate: '', assignee: '' });
  };

  const getUpcomingDeadlines = () => {
    const now = new Date();
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return events
      .filter(event => {
        const dueDate = new Date(event.dueDate);
        return event.status === 'pending' && dueDate >= now && dueDate <= next7Days;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  };

  const getReminders = () => {
    const now = new Date();
    const reminders: { event: Deadline; type: '24h' | '2h' }[] = [];

    events.forEach(event => {
      if (event.status !== 'pending') return;
      
      const dueDate = new Date(event.dueDate);
      const hoursUntil = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntil <= 24 && hoursUntil > 2 && !event.reminderSent24h) {
        reminders.push({ event, type: '24h' });
      } else if (hoursUntil <= 2 && hoursUntil > 0 && !event.reminderSent2h) {
        reminders.push({ event, type: '2h' });
      }
    });

    return reminders;
  };

  const upcomingDeadlines = getUpcomingDeadlines();
  const reminders = getReminders();

  return (
    <div className="space-y-6">
      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Your upcoming firm deadlines and hearings appear here. Synced automatically with Google Calendar.
        </AlertDescription>
      </Alert>

      {/* Reminders */}
      {reminders.length > 0 && (
        <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
              <AlertCircle className="h-5 w-5" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {reminders.map(({ event, type }) => (
              <div key={event.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg">
                <div>
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-muted-foreground">
                    Due: {new Date(event.dueDate).toLocaleString()}
                  </p>
                </div>
                <Badge variant={type === '2h' ? 'destructive' : 'default'}>
                  {type === '24h' ? 'Due in 24h' : 'Due in 2h'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Upcoming Deadlines Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Upcoming Deadlines (Next 7 Days)
              </CardTitle>
              <CardDescription>
                {upcomingDeadlines.length} deadline{upcomingDeadlines.length !== 1 ? 's' : ''} coming up
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Deadline
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {upcomingDeadlines.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No upcoming deadlines</p>
          ) : (
            <div className="space-y-3">
              {upcomingDeadlines.map(event => {
                const caseData = [].find(c => c.id === event.caseId);
                const user = [].find(u => u.id === event.assignee);
                return (
                  <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {caseData?.caseNumber} - {caseData?.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Assigned to: {user?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {new Date(event.dueDate).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Google Calendar Embed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Calendar View
          </CardTitle>
          <CardDescription>
            Integrated calendar for scheduling and appointments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full rounded-lg overflow-hidden border" style={{ height: '600px' }}>
            <iframe 
              src="https://calendar.google.com/calendar/appointments/schedules/AcZssZ3NEJ7EuoupdSKiKK9lIYok47hV5nFl1fZWrQzCtbOeOqK-yoxrZF14eY7tEvm9LrFsL6pjJDvM?gv=true" 
              style={{ border: 0, width: '100%', height: '600px' }} 
              width="100%" 
              height="600" 
              frameBorder="0"
              title="Google Calendar"
              loading="lazy"
              allowFullScreen
            />
          </div>
        </CardContent>
      </Card>

      {/* Add Deadline Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Deadline</DialogTitle>
            <DialogDescription>
              Create a new deadline or reminder for a case
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., File motion response"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="case">Case *</Label>
              <Select value={formData.caseId} onValueChange={(value) => setFormData({ ...formData, caseId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a case" />
                </SelectTrigger>
                <SelectContent>
                  {[].filter(c => c.status === 'active').map(caseItem => (
                    <SelectItem key={caseItem.id} value={caseItem.id}>
                      {caseItem.caseNumber} - {caseItem.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date & Time *</Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignee">Assignee *</Label>
              <Select value={formData.assignee} onValueChange={(value) => setFormData({ ...formData, assignee: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  {[].map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddDeadline}>
              Add Deadline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
