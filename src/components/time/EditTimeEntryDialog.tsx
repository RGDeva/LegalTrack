import { useState, useEffect } from 'react';
import { Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { API_URL } from '@/lib/api-url';

interface TimeEntry {
  id: string;
  description: string;
  billingCodeId?: string;
  tags: string[];
  status: string;
}

interface EditTimeEntryDialogProps {
  entry: TimeEntry;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function EditTimeEntryDialog({ entry, open, onClose, onSaved }: EditTimeEntryDialogProps) {
  const [loading, setLoading] = useState(false);
  const [billingCodes, setBillingCodes] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    description: entry.description,
    billingCodeId: entry.billingCodeId || '',
    tags: entry.tags.join(', '),
    recalculateRate: false
  });

  useEffect(() => {
    if (open) {
      loadBillingCodes();
      setFormData({
        description: entry.description,
        billingCodeId: entry.billingCodeId || '',
        tags: entry.tags.join(', '),
        recalculateRate: false
      });
    }
  }, [open, entry]);

  const loadBillingCodes = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/billing-codes/active`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setBillingCodes(data);
    } catch (error) {
      console.error('Error loading billing codes:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const tags = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const res = await fetch(`${API_URL}/time-entries/${entry.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: formData.description,
          billingCodeId: formData.billingCodeId || undefined,
          tags,
          recalculateRate: formData.recalculateRate
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Time entry updated');
        onSaved();
      } else {
        toast.error(data.error || 'Failed to update time entry');
      }
    } catch (error) {
      console.error('Error updating time entry:', error);
      toast.error('Failed to update time entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Time Entry
          </DialogTitle>
          <DialogDescription>
            Update the time entry details. Changes to billing code will recalculate the amount.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-billingCode">Billing Code</Label>
            <Select
              value={formData.billingCodeId || undefined}
              onValueChange={(value) => setFormData({ ...formData, billingCodeId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select billing code (optional)" />
              </SelectTrigger>
              <SelectContent>
                {billingCodes.map((code) => (
                  <SelectItem key={code.id} value={code.id}>
                    {code.code} - {code.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-tags">Tags</Label>
            <Input
              id="edit-tags"
              placeholder="research, client-call, urgent (comma-separated)"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="recalculate"
              checked={formData.recalculateRate}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, recalculateRate: checked as boolean })
              }
            />
            <Label htmlFor="recalculate" className="text-sm font-normal cursor-pointer">
              Recalculate rate (updates amount based on current billing code rates)
            </Label>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
