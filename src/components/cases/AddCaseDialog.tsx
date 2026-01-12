import { useState } from 'react';
import { Plus } from 'lucide-react';
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

interface AddCaseDialogProps {
  onCaseAdded?: (newCase: Case) => void;
}

export function AddCaseDialog({ onCaseAdded }: AddCaseDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    caseNumber: '',
    title: '',
    clientId: '',
    type: '',
    status: 'active' as const,
    priority: 'medium' as const,
    assignedTo: '',
    nextHearing: '',
    notes: '',
    billingType: 'hourly' as const,
    hourlyRate: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    console.log('AddCaseDialog: Form submitted', formData);

    try {
      // Validation - only title is required
      if (!formData.title || !formData.title.trim()) {
        console.log('AddCaseDialog: Validation failed - no title');
        toast.error('Please enter a case title');
        setLoading(false);
        return;
      }

      // Create case via API
      const token = localStorage.getItem('authToken');
      console.log('AddCaseDialog: Token exists:', !!token);
      console.log('AddCaseDialog: API URL:', API_URL);

      const payload = {
        matterNumber: formData.caseNumber || undefined,
        title: formData.title,
        clientId: formData.clientId || null,
        clientName: formData.clientId || null,
        status: formData.status || 'Active',
        type: formData.type || 'General',
        priority: formData.priority || 'Medium',
        assignedTo: formData.assignedTo || null,
        nextHearing: formData.nextHearing ? new Date(formData.nextHearing) : null,
        description: formData.notes || null
      };

      console.log('AddCaseDialog: Sending payload:', payload);

      const res = await fetch(`${API_URL}/cases`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('AddCaseDialog: Response status:', res.status);

      const data = await res.json();
      console.log('AddCaseDialog: Response data:', data);
      
      if (res.ok) {
        console.log('AddCaseDialog: Case created successfully');
        toast.success('Case created successfully');
        
        // Callback to parent
        if (onCaseAdded) {
          onCaseAdded(data);
        }

        // Reset form and close
        setFormData({
          caseNumber: '',
          title: '',
          clientId: '',
          type: '',
          status: 'active',
          priority: 'medium',
          assignedTo: '',
          nextHearing: '',
          notes: '',
          billingType: 'hourly',
          hourlyRate: 0,
        });
        setOpen(false);
      } else {
        console.error('AddCaseDialog: Failed to create case:', data);
        toast.error(data.error || 'Failed to create case');
        setLoading(false);
      }
    } catch (error) {
      console.error('AddCaseDialog: Exception caught:', error);
      toast.error(`Failed to create case: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Case
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Case</DialogTitle>
          <DialogDescription>
            Add a new case to the system. Fill in all required fields marked with *.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Title */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Johnson v. Smith Corp"
                className="col-span-3"
                required
              />
            </div>

            {/* Case Number */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="caseNumber" className="text-right">
                Case Number
              </Label>
              <Input
                id="caseNumber"
                value={formData.caseNumber}
                onChange={(e) => setFormData({ ...formData, caseNumber: e.target.value })}
                placeholder="Auto-generated if left blank"
                className="col-span-3"
              />
            </div>

            {/* Type */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Case Type
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select case type" />
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

            {/* Assigned Attorney */}
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
                placeholder="Additional case details..."
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
              {loading ? 'Creating...' : 'Create Case'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
