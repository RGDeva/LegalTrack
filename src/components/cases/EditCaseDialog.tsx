import { useState, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Case } from '@/types';
import { API_URL } from '@/lib/api-url';

interface EditCaseDialogProps {
  case: Case;
  onCaseUpdated?: () => void;
}

export function EditCaseDialog({ case: caseData, onCaseUpdated }: EditCaseDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    caseNumber: caseData.caseNumber,
    title: caseData.title,
    clientId: caseData.clientId,
    type: caseData.type,
    status: caseData.status,
    priority: caseData.priority,
    assignedTo: caseData.assignedTo,
    nextHearing: caseData.nextHearing || '',
    notes: caseData.description,
    billingType: caseData.billingType,
    hourlyRate: caseData.hourlyRate || 0,
  });

  useEffect(() => {
    // Update form when case data changes
    setFormData({
      caseNumber: caseData.caseNumber,
      title: caseData.title,
      clientId: caseData.clientId,
      type: caseData.type,
      status: caseData.status,
      priority: caseData.priority,
      assignedTo: caseData.assignedTo,
      nextHearing: caseData.nextHearing || '',
      notes: caseData.description,
      billingType: caseData.billingType,
      hourlyRate: caseData.hourlyRate || 0,
    });
  }, [caseData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!formData.caseNumber || !formData.title) {
        toast.error('Please fill in all required fields');
        setLoading(false);
        return;
      }
      
      // Update case via API
      const token = localStorage.getItem('authToken');
            const res = await fetch(`${API_URL}/cases/${caseData.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          caseNumber: formData.caseNumber,
          title: formData.title,
          clientId: formData.clientId || null,
          clientName: formData.clientId || 'Unknown Client',
          status: formData.status,
          type: formData.type,
          priority: formData.priority,
          assignedTo: formData.assignedTo || null,
          nextHearing: formData.nextHearing ? new Date(formData.nextHearing) : null,
          description: formData.notes,
          billingType: formData.billingType,
          hourlyRate: formData.hourlyRate || null
        })
      });

      if (res.ok) {
        toast.success('Case updated successfully');
        if (onCaseUpdated) {
          onCaseUpdated();
        }
        setOpen(false);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update case');
      }
    } catch (error) {
      console.error('Error updating case:', error);
      toast.error('Failed to update case');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Pencil className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Case</DialogTitle>
          <DialogDescription>
            Update case information. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Case Number */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="caseNumber" className="text-right">
                Case Number *
              </Label>
              <Input
                id="caseNumber"
                value={formData.caseNumber}
                onChange={(e) => setFormData({ ...formData, caseNumber: e.target.value })}
                className="col-span-3"
                required
              />
            </div>

            {/* Title */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="col-span-3"
                required
              />
            </div>

            {/* Client */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="client" className="text-right">
                Client
              </Label>
              <Input
                id="client"
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                placeholder="Client name (optional)"
                className="col-span-3"
              />
            </div>

            {/* Type */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Case Type *
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Civil Litigation">Civil Litigation</SelectItem>
                  <SelectItem value="Criminal Defense">Criminal Defense</SelectItem>
                  <SelectItem value="Family Law">Family Law</SelectItem>
                  <SelectItem value="Corporate">Corporate</SelectItem>
                  <SelectItem value="Real Estate">Real Estate</SelectItem>
                  <SelectItem value="Estate Planning">Estate Planning</SelectItem>
                  <SelectItem value="Immigration">Immigration</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="priority" className="text-right">
                Priority
              </Label>
              <Select
                value={formData.priority}
                onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger className="col-span-3">
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

            {/* Assigned To */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="assignedTo" className="text-right">
                Assigned To
              </Label>
              <Input
                id="assignedTo"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                placeholder="Attorney name (optional)"
                className="col-span-3"
              />
            </div>

            {/* Next Hearing */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nextHearing" className="text-right">
                Next Hearing
              </Label>
              <Input
                id="nextHearing"
                type="datetime-local"
                value={formData.nextHearing}
                onChange={(e) => setFormData({ ...formData, nextHearing: e.target.value })}
                className="col-span-3"
              />
            </div>

            {/* Notes */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="notes" className="text-right pt-2">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="col-span-3"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Case'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
