import { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, Clock, MapPin, Trash2,
  Edit, Loader2, Calendar as CalendarIcon, Briefcase, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { API_URL } from '@/lib/api-url';
import { cn } from '@/lib/utils';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  location?: string;
  type: string;
  color?: string;
  caseId?: string;
  assignedToId?: string;
  createdById: string;
}

interface CaseOption {
  id: string;
  caseNumber: string;
  title: string;
}

const EVENT_TYPES = [
  { value: 'event', label: 'Event', color: '#3b82f6' },
  { value: 'hearing', label: 'Court Hearing', color: '#ef4444' },
  { value: 'deadline', label: 'Deadline', color: '#f59e0b' },
  { value: 'meeting', label: 'Meeting', color: '#8b5cf6' },
  { value: 'reminder', label: 'Reminder', color: '#10b981' },
];

const getEventColor = (type: string, customColor?: string) => {
  if (customColor) return customColor;
  return EVENT_TYPES.find(t => t.value === type)?.color || '#3b82f6';
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const emptyForm = {
  title: '',
  description: '',
  startDate: '',
  startTime: '09:00',
  endDate: '',
  endTime: '10:00',
  allDay: false,
  location: '',
  type: 'event',
  caseId: '',
};

export function MonthlyCalendar() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [cases, setCases] = useState<CaseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [view, setView] = useState<'month' | 'list'>('month');

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const startOfMonth = new Date(currentYear, currentMonth, 1);
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

      // Pad to show events from visible days of prev/next month
      const startDate = new Date(startOfMonth);
      startDate.setDate(startDate.getDate() - startOfMonth.getDay());
      const endDate = new Date(endOfMonth);
      endDate.setDate(endDate.getDate() + (6 - endOfMonth.getDay()));

      const res = await fetch(
        `${API_URL}/events?start=${startDate.toISOString()}&end=${endDate.toISOString()}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (res.ok) {
        const data = await res.json();
        setEvents(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear]);

  const fetchCases = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      const res = await fetch(`${API_URL}/cases`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCases(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch cases:', error);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  // Calendar grid helpers
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const daysInPrevMonth = getDaysInMonth(currentYear, currentMonth - 1);

    const days: { date: number; month: number; year: number; isCurrentMonth: boolean }[] = [];

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      days.push({ date: daysInPrevMonth - i, month: prevMonth, year: prevYear, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: i, month: currentMonth, year: currentYear, isCurrentMonth: true });
    }

    // Next month days to fill the grid
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      days.push({ date: i, month: nextMonth, year: nextYear, isCurrentMonth: false });
    }

    return days;
  };

  const getEventsForDay = (date: number, month: number, year: number) => {
    return events.filter(event => {
      const eventStart = new Date(event.startTime);
      return eventStart.getDate() === date &&
        eventStart.getMonth() === month &&
        eventStart.getFullYear() === year;
    });
  };

  const isToday = (date: number, month: number, year: number) => {
    return date === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  // Navigation
  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  // Event CRUD
  const openCreateDialog = (date?: number) => {
    const dateStr = date
      ? `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`
      : '';
    setEditingEvent(null);
    setFormData({ ...emptyForm, startDate: dateStr, endDate: dateStr });
    setShowEventDialog(true);
  };

  const openEditDialog = (event: CalendarEvent) => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      startDate: start.toISOString().split('T')[0],
      startTime: start.toTimeString().slice(0, 5),
      endDate: end.toISOString().split('T')[0],
      endTime: end.toTimeString().slice(0, 5),
      allDay: event.allDay,
      location: event.location || '',
      type: event.type,
      caseId: event.caseId || '',
    });
    setShowDetailDialog(false);
    setShowEventDialog(true);
  };

  const handleSaveEvent = async () => {
    if (!formData.title || !formData.startDate || !formData.endDate) {
      toast.error('Please fill in title and dates');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const startTime = formData.allDay
        ? new Date(`${formData.startDate}T00:00:00`)
        : new Date(`${formData.startDate}T${formData.startTime}`);
      const endTime = formData.allDay
        ? new Date(`${formData.endDate}T23:59:59`)
        : new Date(`${formData.endDate}T${formData.endTime}`);

      const body = {
        title: formData.title,
        description: formData.description || null,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        allDay: formData.allDay,
        location: formData.location || null,
        type: formData.type,
        caseId: formData.caseId || null,
      };

      const url = editingEvent
        ? `${API_URL}/events/${editingEvent.id}`
        : `${API_URL}/events`;
      const method = editingEvent ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        toast.success(editingEvent ? 'Event updated' : 'Event created');
        setShowEventDialog(false);
        setEditingEvent(null);
        fetchEvents();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to save event');
      }
    } catch (error) {
      console.error('Save event error:', error);
      toast.error('Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const res = await fetch(`${API_URL}/events/${eventId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success('Event deleted');
        setShowDetailDialog(false);
        setSelectedEvent(null);
        fetchEvents();
      } else {
        toast.error('Failed to delete event');
      }
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };

  const openEventDetail = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowDetailDialog(true);
  };

  // Upcoming events for list view
  const upcomingEvents = events
    .filter(e => new Date(e.startTime) >= new Date())
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const calendarDays = generateCalendarDays();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={goToPrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold min-w-[200px] text-center">
            {MONTHS[currentMonth]} {currentYear}
          </h2>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={view === 'month' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none"
              onClick={() => setView('month')}
            >
              Month
            </Button>
            <Button
              variant={view === 'list' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none"
              onClick={() => setView('list')}
            >
              List
            </Button>
          </div>
          <Button onClick={() => openCreateDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : view === 'month' ? (
        /* Month Grid View */
        <Card>
          <CardContent className="p-0">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b">
              {DAYS.map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0">
                  {day}
                </div>
              ))}
            </div>
            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, idx) => {
                const dayEvents = getEventsForDay(day.date, day.month, day.year);
                const isTodayCell = isToday(day.date, day.month, day.year);
                return (
                  <div
                    key={idx}
                    className={cn(
                      "min-h-[100px] border-r border-b last:border-r-0 p-1 cursor-pointer hover:bg-muted/30 transition-colors",
                      !day.isCurrentMonth && "bg-muted/10",
                    )}
                    onClick={() => day.isCurrentMonth && openCreateDialog(day.date)}
                  >
                    <div className={cn(
                      "text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full",
                      isTodayCell && "bg-primary text-primary-foreground",
                      !day.isCurrentMonth && "text-muted-foreground/50"
                    )}>
                      {day.date}
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map(event => (
                        <div
                          key={event.id}
                          className="text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80"
                          style={{
                            backgroundColor: `${getEventColor(event.type, event.color || undefined)}20`,
                            color: getEventColor(event.type, event.color || undefined),
                            borderLeft: `3px solid ${getEventColor(event.type, event.color || undefined)}`
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEventDetail(event);
                          }}
                          title={event.title}
                        >
                          {!event.allDay && (
                            <span className="font-medium">
                              {new Date(event.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}{' '}
                            </span>
                          )}
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-muted-foreground px-1.5">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* List View */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Upcoming Events ({upcomingEvents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No upcoming events</p>
                <Button variant="outline" className="mt-4" onClick={() => openCreateDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first event
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map(event => {
                  const start = new Date(event.startTime);
                  const end = new Date(event.endTime);
                  const eventColor = getEventColor(event.type, event.color || undefined);
                  return (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 cursor-pointer transition-colors"
                      style={{ borderLeftWidth: '4px', borderLeftColor: eventColor }}
                      onClick={() => openEventDetail(event)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{event.title}</p>
                          <Badge variant="outline" className="text-xs shrink-0" style={{ color: eventColor, borderColor: eventColor }}>
                            {EVENT_TYPES.find(t => t.value === event.type)?.label || event.type}
                          </Badge>
                        </div>
                        {event.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{event.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {event.allDay ? (
                              start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                            ) : (
                              <>
                                {start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}{' '}
                                {start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} -{' '}
                                {end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                              </>
                            )}
                          </span>
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Event Type Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {EVENT_TYPES.map(type => (
          <div key={type.value} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: type.color }} />
            {type.label}
          </div>
        ))}
      </div>

      {/* Create/Edit Event Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Edit Event' : 'New Event'}</DialogTitle>
            <DialogDescription>
              {editingEvent ? 'Update event details' : 'Add a new event to your calendar'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="evt-title">Title *</Label>
              <Input
                id="evt-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Client Meeting"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Event Type</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: t.color }} />
                          {t.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Related Case</Label>
                <Select value={formData.caseId} onValueChange={(v) => setFormData({ ...formData, caseId: v === 'none' ? '' : v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {cases.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.caseNumber} - {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.allDay}
                onCheckedChange={(v) => setFormData({ ...formData, allDay: v })}
              />
              <Label>All day event</Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value, endDate: formData.endDate || e.target.value })}
                />
              </div>
              {!formData.allDay && (
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>End Date *</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
              {!formData.allDay && (
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Conference Room A"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Event details..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEventDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveEvent} disabled={saving}>
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
              ) : editingEvent ? 'Update Event' : 'Create Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-md">
          {selectedEvent && (() => {
            const start = new Date(selectedEvent.startTime);
            const end = new Date(selectedEvent.endTime);
            const eventColor = getEventColor(selectedEvent.type, selectedEvent.color || undefined);
            const linkedCase = cases.find(c => c.id === selectedEvent.caseId);
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: eventColor }} />
                    <DialogTitle>{selectedEvent.title}</DialogTitle>
                  </div>
                  <Badge variant="outline" className="w-fit" style={{ color: eventColor, borderColor: eventColor }}>
                    {EVENT_TYPES.find(t => t.value === selectedEvent.type)?.label || selectedEvent.type}
                  </Badge>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {selectedEvent.allDay ? (
                      <span>{start.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    ) : (
                      <span>
                        {start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}{' '}
                        {start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} -{' '}
                        {end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  {selectedEvent.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedEvent.location}</span>
                    </div>
                  )}
                  {linkedCase && (
                    <div className="flex items-center gap-2 text-sm">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span>{linkedCase.caseNumber} - {linkedCase.title}</span>
                    </div>
                  )}
                  {selectedEvent.description && (
                    <div className="text-sm text-muted-foreground border-t pt-3 mt-3">
                      {selectedEvent.description}
                    </div>
                  )}
                </div>
                <DialogFooter className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteEvent(selectedEvent.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                  <Button size="sm" onClick={() => openEditDialog(selectedEvent)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
