import { useState, useEffect } from 'react';
import { Clock, Edit, Trash2, DollarSign, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { EditTimeEntryDialog } from './EditTimeEntryDialog';
import { API_URL } from '@/lib/api-url';

interface TimeEntry {
  id: string;
  description: string;
  durationMinutesRaw: number;
  durationMinutesBilled: number;
  rateCentsApplied: number;
  amountCents: number;
  status: string;
  createdAt: string;
  billingCode?: {
    id: string;
    code: string;
    label: string;
  };
  user: {
    id: string;
    name: string;
    role: string;
  };
  tags: string[];
}

interface TimeEntriesRunsheetProps {
  matterId: string;
  onEntryUpdated?: () => void;
}

export function TimeEntriesRunsheet({ matterId, onEntryUpdated }: TimeEntriesRunsheetProps) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);

  useEffect(() => {
    loadEntries();
  }, [matterId]);

  const loadEntries = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/time-entries/matter/${matterId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setEntries(data);
    } catch (error) {
      console.error('Error loading time entries:', error);
      toast.error('Failed to load time entries');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (entryId: string, status: string) => {
    if (status === 'billed') {
      toast.error('Cannot delete billed time entries');
      return;
    }

    if (!confirm('Are you sure you want to delete this time entry?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/time-entries/${entryId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success('Time entry deleted');
        loadEntries();
        onEntryUpdated?.();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete entry');
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('Failed to delete entry');
    }
  };

  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const formatAmount = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      draft: 'bg-yellow-100 text-yellow-800',
      billed: 'bg-green-100 text-green-800',
      written_off: 'bg-gray-100 text-gray-800'
    };
    return (
      <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Time Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading time entries...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Time Entries ({entries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No time entries yet. Start the timer or add a manual entry.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right">Minutes</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-sm">
                        {formatDate(entry.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md">
                          <p className="text-sm">{entry.description}</p>
                          {entry.tags && entry.tags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {entry.tags.map((tag, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  <Tag className="h-3 w-3 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {entry.user.name}
                      </TableCell>
                      <TableCell className="text-sm">
                        {entry.billingCode ? (
                          <Badge variant="outline">
                            {entry.billingCode.code}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        <div>
                          <div className="font-medium">
                            {formatDuration(entry.durationMinutesBilled)}
                          </div>
                          {entry.durationMinutesRaw !== entry.durationMinutesBilled && (
                            <div className="text-xs text-muted-foreground">
                              ({entry.durationMinutesRaw}m raw)
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatAmount(entry.amountCents)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(entry.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingEntry(entry)}
                            disabled={entry.status === 'billed'}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(entry.id, entry.status)}
                            disabled={entry.status === 'billed'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {editingEntry && (
        <EditTimeEntryDialog
          entry={editingEntry}
          open={!!editingEntry}
          onClose={() => setEditingEntry(null)}
          onSaved={() => {
            setEditingEntry(null);
            loadEntries();
            onEntryUpdated?.();
          }}
        />
      )}
    </>
  );
}
