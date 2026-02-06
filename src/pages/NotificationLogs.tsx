import { useState, useEffect } from 'react';
import { Bell, Mail, AlertCircle, CheckCircle, XCircle, Filter, Download, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { API_URL } from '@/lib/api-url';

interface NotificationLog {
  id: string;
  recipientEmail: string;
  recipientName: string | null;
  type: string;
  subject: string;
  status: string;
  sentAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

interface NotificationStats {
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  period: string;
}

const NotificationLogs = () => {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0,
    total: 0
  });

  useEffect(() => {
    loadLogs();
    loadStats();
  }, [filters, pagination.offset]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
        ...(filters.type && { type: filters.type }),
        ...(filters.status && { status: filters.status })
      });

      const res = await fetch(`${API_URL}/notifications/logs?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data.notifications) ? data.notifications : []);
        setPagination(prev => ({ ...prev, total: data.total || 0 }));
      } else {
        toast.error('Failed to load notification logs');
      }
    } catch (error) {
      console.error('Error loading logs:', error);
      toast.error('Failed to load notification logs');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/notifications/stats?days=30`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const triggerNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/notifications/run-scheduled`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        toast.success('Notifications triggered successfully');
        loadLogs();
        loadStats();
      } else {
        toast.error('Failed to trigger notifications');
      }
    } catch (error) {
      console.error('Error triggering notifications:', error);
      toast.error('Failed to trigger notifications');
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'invoice_overdue': 'Invoice Overdue',
      'invoice_upcoming': 'Invoice Due Soon',
      'deadline_alert': 'Deadline Alert',
      'task_assignment': 'Task Assignment',
      'password_reset': 'Password Reset',
      'welcome': 'Welcome Email'
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'invoice_overdue': 'destructive',
      'invoice_upcoming': 'default',
      'deadline_alert': 'secondary',
      'task_assignment': 'default',
      'password_reset': 'outline',
      'welcome': 'outline'
    };
    return colors[type] || 'default';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'bounced':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        log.recipientEmail.toLowerCase().includes(search) ||
        log.recipientName?.toLowerCase().includes(search) ||
        log.subject.toLowerCase().includes(search)
      );
    }
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notification Logs</h1>
          <p className="text-muted-foreground">Monitor and manage email notifications</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={triggerNotifications} disabled={loading}>
            <Bell className="h-4 w-4 mr-2" />
            Trigger Notifications
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">{stats.period}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.total > 0 
                  ? Math.round((stats.byStatus.sent || 0) / stats.total * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.byStatus.sent || 0} successful
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {stats.byStatus.failed || 0}
              </div>
              <p className="text-xs text-muted-foreground">Delivery failures</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Most Common</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {Object.entries(stats.byType).sort((a, b) => b[1] - a[1])[0]?.[0] 
                  ? getTypeLabel(Object.entries(stats.byType).sort((a, b) => b[1] - a[1])[0][0])
                  : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                {Object.entries(stats.byType).sort((a, b) => b[1] - a[1])[0]?.[1] || 0} sent
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                placeholder="Search by email or subject..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
            <div>
              <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="invoice_overdue">Invoice Overdue</SelectItem>
                  <SelectItem value="invoice_upcoming">Invoice Due Soon</SelectItem>
                  <SelectItem value="deadline_alert">Deadline Alert</SelectItem>
                  <SelectItem value="task_assignment">Task Assignment</SelectItem>
                  <SelectItem value="password_reset">Password Reset</SelectItem>
                  <SelectItem value="welcome">Welcome Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="bounced">Bounced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
          <CardDescription>
            Showing {filteredLogs.length} of {pagination.total} notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="mt-1">
                  {getStatusIcon(log.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium truncate">{log.subject}</p>
                      <p className="text-sm text-muted-foreground">
                        To: {log.recipientName || log.recipientEmail}
                      </p>
                      <p className="text-xs text-muted-foreground">{log.recipientEmail}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={getTypeColor(log.type) as any}>
                        {getTypeLabel(log.type)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.sentAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredLogs.length === 0 && (
              <div className="text-center py-12">
                <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No notifications found</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.total > pagination.limit && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
                disabled={pagination.offset === 0 || loading}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {Math.floor(pagination.offset / pagination.limit) + 1} of{' '}
                {Math.ceil(pagination.total / pagination.limit)}
              </span>
              <Button
                variant="outline"
                onClick={() => setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
                disabled={pagination.offset + pagination.limit >= pagination.total || loading}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationLogs;
