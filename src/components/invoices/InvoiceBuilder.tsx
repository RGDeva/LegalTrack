import { useState, useEffect } from 'react';
import { FileText, Plus, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { API_URL } from '@/lib/api-url';

interface TimeEntry {
  id: string;
  description: string;
  durationMinutesBilled: number;
  rateCentsApplied: number;
  amountCents: number;
  createdAt: string;
  user: {
    name: string;
  };
  billingCode?: {
    code: string;
    label: string;
  };
}

interface Case {
  id: string;
  caseNumber: string;
  title: string;
  clientName: string;
}

export function InvoiceBuilder() {
  const [open, setOpen] = useState(false);
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedMatterId, setSelectedMatterId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadCases();
    }
  }, [open]);

  const loadCases = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/cases`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setCases(data);
    } catch (error) {
      console.error('Error loading cases:', error);
      toast.error('Failed to load cases');
    }
  };

  const loadDraftEntries = async () => {
    if (!selectedMatterId) {
      toast.error('Please select a matter');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const res = await fetch(
        `${API_URL}/invoices/draft-entries/${selectedMatterId}?${params}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await res.json();
      setEntries(data);
      setSelectedEntries(new Set());
    } catch (error) {
      console.error('Error loading draft entries:', error);
      toast.error('Failed to load draft entries');
    } finally {
      setLoading(false);
    }
  };

  const toggleEntry = (entryId: string) => {
    const newSelected = new Set(selectedEntries);
    if (newSelected.has(entryId)) {
      newSelected.delete(entryId);
    } else {
      newSelected.add(entryId);
    }
    setSelectedEntries(newSelected);
  };

  const toggleAll = () => {
    if (selectedEntries.size === entries.length) {
      setSelectedEntries(new Set());
    } else {
      setSelectedEntries(new Set(entries.map(e => e.id)));
    }
  };

  const calculateTotal = () => {
    return entries
      .filter(e => selectedEntries.has(e.id))
      .reduce((sum, e) => sum + e.amountCents, 0);
  };

  const handleCreateInvoice = async () => {
    if (selectedEntries.size === 0) {
      toast.error('Please select at least one time entry');
      return;
    }

    if (!invoiceNumber) {
      toast.error('Please enter an invoice number');
      return;
    }

    if (!dueDate) {
      toast.error('Please select a due date');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/invoices/from-entries`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          matterId: selectedMatterId,
          timeEntryIds: Array.from(selectedEntries),
          invoiceNumber,
          dueDate: new Date(dueDate)
        })
      });

      if (res.ok) {
        const invoice = await res.json();
        toast.success(`Invoice ${invoice.invoiceNumber} created successfully`);
        setOpen(false);
        resetForm();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to create invoice');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedMatterId('');
    setStartDate('');
    setEndDate('');
    setEntries([]);
    setSelectedEntries(new Set());
    setInvoiceNumber('');
    setDueDate('');
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
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice from Time Entries
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoice Builder
          </DialogTitle>
          <DialogDescription>
            Select time entries to include in the invoice. Only draft entries are shown.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Matter Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="matter">Matter *</Label>
              <Select value={selectedMatterId} onValueChange={setSelectedMatterId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select matter" />
                </SelectTrigger>
                <SelectContent>
                  {cases.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.caseNumber} - {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date Range (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="Start"
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="End"
                />
              </div>
            </div>
          </div>

          <Button onClick={loadDraftEntries} disabled={!selectedMatterId || loading}>
            {loading ? 'Loading...' : 'Load Draft Entries'}
          </Button>

          {/* Time Entries Table */}
          {entries.length > 0 && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Draft Time Entries ({entries.length})
                  </CardTitle>
                  <CardDescription>
                    Select entries to include in the invoice
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedEntries.size === entries.length && entries.length > 0}
                            onCheckedChange={toggleAll}
                          />
                        </TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead className="text-right">Time</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedEntries.has(entry.id)}
                              onCheckedChange={() => toggleEntry(entry.id)}
                            />
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(entry.createdAt)}
                          </TableCell>
                          <TableCell className="max-w-md text-sm">
                            {entry.description}
                          </TableCell>
                          <TableCell className="text-sm">
                            {entry.user.name}
                          </TableCell>
                          <TableCell className="text-sm">
                            {entry.billingCode?.code || '-'}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {formatDuration(entry.durationMinutesBilled)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatAmount(entry.amountCents)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="mt-4 flex justify-between items-center p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">
                      {selectedEntries.size} of {entries.length} entries selected
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <span className="text-2xl font-bold">
                        {formatAmount(calculateTotal())}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Invoice Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Invoice Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="invoiceNumber">Invoice Number *</Label>
                      <Input
                        id="invoiceNumber"
                        placeholder="INV-2024-001"
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dueDate">Due Date *</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateInvoice}
                      disabled={loading || selectedEntries.size === 0}
                    >
                      {loading ? 'Creating...' : `Create Invoice (${formatAmount(calculateTotal())})`}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {entries.length === 0 && selectedMatterId && !loading && (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No draft time entries found for the selected matter and date range.
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
