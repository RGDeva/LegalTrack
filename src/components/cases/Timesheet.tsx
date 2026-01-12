import { useState } from "react";
import { Clock, DollarSign, Edit2, Save, X, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TimeEntry } from "@/types";
import { toast } from "sonner";

interface TimesheetProps {
  caseId: string;
}

const Timesheet = ({ caseId }: TimesheetProps) => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(
    [].filter(entry => entry.caseId === caseId)
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<TimeEntry>>({});

  const handleEdit = (entry: TimeEntry) => {
    setEditingId(entry.id);
    setEditForm({
      description: entry.description,
      duration: entry.duration,
      rate: entry.rate,
      billable: entry.billable,
      billingCode: entry.billingCode,
    });
  };

  const handleSave = (id: string) => {
    setTimeEntries(entries =>
      entries.map(entry => {
        if (entry.id === id) {
          const updatedEntry = {
            ...entry,
            ...editForm,
            amount: (editForm.duration || entry.duration) * (editForm.rate || entry.rate) / 10, // 6-minute increments
          };
          toast.success("Time entry updated");
          return updatedEntry;
        }
        return entry;
      })
    );
    setEditingId(null);
    setEditForm({});
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const formatDuration = (duration: number) => {
    const hours = Math.floor(duration / 10);
    const minutes = (duration % 10) * 6;
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  const totalBilled = timeEntries
    .filter(e => e.billed)
    .reduce((sum, e) => sum + e.amount, 0);
  
  const totalUnbilled = timeEntries
    .filter(e => !e.billed && e.billable)
    .reduce((sum, e) => sum + e.amount, 0);
  
  const totalHours = timeEntries.reduce((sum, e) => sum + e.duration, 0) / 10;

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
              ${totalBilled.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {timeEntries.filter(e => e.billed).length} entries billed
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
              ${totalUnbilled.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {timeEntries.filter(e => !e.billed && e.billable).length} entries pending
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
                  <TableHead>Time</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Attorney</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.date}</TableCell>
                    <TableCell>
                      {editingId === entry.id ? (
                        <Input
                          type="number"
                          value={editForm.duration}
                          onChange={(e) => setEditForm({ ...editForm, duration: Number(e.target.value) })}
                          className="w-20"
                          min="1"
                          step="1"
                        />
                      ) : (
                        formatDuration(entry.duration)
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {editingId === entry.id ? (
                        <Textarea
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          className="min-h-[60px]"
                        />
                      ) : (
                        <span className="line-clamp-2">{entry.description}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        {entry.attorney}
                      </div>
                    </TableCell>
                    <TableCell>
                      {editingId === entry.id ? (
                        <Input
                          value={editForm.billingCode}
                          onChange={(e) => setEditForm({ ...editForm, billingCode: e.target.value })}
                          className="w-20"
                          maxLength={10}
                        />
                      ) : (
                        <Badge variant="outline" className="font-mono text-xs">
                          {entry.billingCode || 'N/A'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingId === entry.id ? (
                        <Input
                          type="number"
                          value={editForm.rate}
                          onChange={(e) => setEditForm({ ...editForm, rate: Number(e.target.value) })}
                          className="w-24 text-right"
                          min="0"
                          step="25"
                        />
                      ) : (
                        `$${entry.rate}/hr`
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ${entry.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {entry.billed ? (
                          <Badge className="bg-success text-success-foreground">Billed</Badge>
                        ) : entry.billable ? (
                          <Badge className="bg-warning text-warning-foreground">Unbilled</Badge>
                        ) : (
                          <Badge variant="secondary">Non-billable</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {editingId === entry.id ? (
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleSave(entry.id)}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={handleCancel}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleEdit(entry)}
                          disabled={entry.billed}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {timeEntries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
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