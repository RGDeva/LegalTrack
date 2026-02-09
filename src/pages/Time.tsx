import { useState, useEffect } from "react";
import { TimeTracker } from "@/components/time/TimeTracker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Clock, DollarSign, Timer, Loader2 } from "lucide-react";
import { API_URL } from "@/lib/api-url";
import { toast } from "sonner";
import { EmptyState } from "@/components/EmptyState";

interface GlobalTimeEntry {
  id: string;
  description: string;
  durationMinutesBilled: number;
  amountCents: number;
  status: string;
  createdAt: string;
  user?: { id: string; name: string; email: string };
  matter?: { id: string; caseNumber: string; title: string };
  billingCode?: { code: string; label: string };
}

const Time = () => {
  const [entries, setEntries] = useState<GlobalTimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/time-entries`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEntries(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching time entries:', error);
      toast.error('Failed to load time entries');
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = entries.filter(entry => {
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    const matchesSearch = searchTerm === '' ||
      entry.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.matter?.caseNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.matter?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalMinutes = filteredEntries.reduce((sum, e) => sum + (e.durationMinutesBilled || 0), 0);
  const totalAmount = filteredEntries.reduce((sum, e) => sum + (e.amountCents || 0), 0);
  const draftCount = entries.filter(e => e.status === 'draft').length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Time Tracking</h1>
        <p className="text-muted-foreground">Track billable hours across all cases (6-minute increments)</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredEntries.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(totalMinutes / 60).toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">{totalMinutes} minutes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalAmount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft Entries</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <TimeTracker />
        </div>
        
        <div className="lg:col-span-2">
          <div className="rounded-lg border bg-card">
            <div className="p-4 border-b flex items-center justify-between gap-4">
              <h3 className="font-semibold whitespace-nowrap">All Time Entries</h3>
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <Input
                  placeholder="Search entries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="billed">Billed</SelectItem>
                    <SelectItem value="invoiced">Invoiced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
                <span className="text-muted-foreground">Loading time entries...</span>
              </div>
            ) : entries.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="No time entries yet"
                description="Start tracking time on your cases. Use the timer or add manual entries."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Case</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No time entries found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-medium">
                          {entry.matter?.caseNumber || '—'}
                        </TableCell>
                        <TableCell>{entry.user?.name || '—'}</TableCell>
                        <TableCell>{entry.durationMinutesBilled} min</TableCell>
                        <TableCell className="max-w-xs truncate">{entry.description}</TableCell>
                        <TableCell>${((entry.amountCents || 0) / 100).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className={
                            entry.status === 'invoiced' ? "bg-success text-success-foreground" :
                            entry.status === 'billed' ? "bg-info text-info-foreground" :
                            "bg-warning text-warning-foreground"
                          }>
                            {entry.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Time;