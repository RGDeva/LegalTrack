import { useState, useEffect } from "react";
import { Clock, DollarSign, User, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { API_URL } from "@/lib/api-url";

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
}

interface TimesheetProps {
  caseId: string;
}

const Timesheet = ({ caseId }: TimesheetProps) => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTimeEntries();
  }, [caseId]);

  const loadTimeEntries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/time-entries/matter/${caseId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTimeEntries(Array.isArray(data) ? data : []);
      } else {
        setTimeEntries([]);
      }
    } catch (error) {
      console.error('Error loading time entries:', error);
      setTimeEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatAmount = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const totalBilled = timeEntries
    .filter(e => e.status === 'billed')
    .reduce((sum, e) => sum + e.amountCents, 0);
  
  const totalUnbilled = timeEntries
    .filter(e => e.status === 'draft')
    .reduce((sum, e) => sum + e.amountCents, 0);
  
  const totalMinutes = timeEntries.reduce((sum, e) => sum + e.durationMinutesBilled, 0);
  const totalHours = totalMinutes / 60;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading time entries...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Total Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              {timeEntries.length} time entries
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-success" />
              Billed Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatAmount(totalBilled)}
            </div>
            <p className="text-xs text-muted-foreground">
              {timeEntries.filter(e => e.status === 'billed').length} entries billed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-warning" />
              Unbilled Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {formatAmount(totalUnbilled)}
            </div>
            <p className="text-xs text-muted-foreground">
              {timeEntries.filter(e => e.status === 'draft').length} entries pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Time Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Time Entries</CardTitle>
          <CardDescription>All time logged for this case</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      {formatDate(entry.createdAt)}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <span className="line-clamp-2">{entry.description}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        {entry.user?.name || 'Unknown'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {entry.billingCode ? (
                        <Badge variant="outline" className="font-mono text-xs">
                          {entry.billingCode.code}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatDuration(entry.durationMinutesBilled)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatAmount(entry.amountCents)}
                    </TableCell>
                    <TableCell>
                      {entry.status === 'billed' ? (
                        <Badge className="bg-success text-success-foreground">Billed</Badge>
                      ) : entry.status === 'draft' ? (
                        <Badge className="bg-warning text-warning-foreground">Draft</Badge>
                      ) : (
                        <Badge variant="secondary">{entry.status}</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {timeEntries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No time entries for this case
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Timesheet;
