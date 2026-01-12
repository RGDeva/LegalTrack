import { useState, useEffect } from 'react';
import { Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { API_URL } from '@/lib/api-url';

interface ManualTimeEntryDialogProps {
  matterId: string;
  onEntrySaved?: () => void;
}

export function ManualTimeEntryDialog({ matterId, onEntrySaved }: ManualTimeEntryDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [billingCodes, setBillingCodes] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    minutes: '',
    description: '',
    billingCodeId: '',
    tags: ''
  });

  useEffect(() => {
    if (open) {
      loadBillingCodes();
    }
  }, [open]);

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
    
    const minutes = parseInt(formData.minutes);
    if (isNaN(minutes) || minutes <= 0) {
      toast.error('Please enter valid minutes');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const tags = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const res = await fetch(`${API_URL}/time-entries/manual`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          matterId,
          description: formData.description,
          durationMinutesRaw: minutes,
          billingCodeId: formData.billingCodeId || undefined,
          tags
        })
      });

      const data = await res.json();
      if (res.ok) {
        const billedMinutes = data.durationMinutesBilled;
        toast.success(`Time entry created: ${billedMinutes} minutes logged (6-min rounding applied)`);
        setFormData({ minutes: '', description: '', billingCodeId: '', tags: '' });
        setOpen(false);
        onEntrySaved?.();
      } else {
        toast.error(data.error || 'Failed to create time entry');
      }
    } catch (error) {
      console.error('Error creating time entry:', error);
      toast.error('Failed to create time entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Manual Entry
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Add Manual Time Entry
          </DialogTitle>
          <DialogDescription>
            Enter time manually. 6-minute rounding will be applied automatically.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="minutes">Minutes Worked *</Label>
            <Input
              id="minutes"
              type="number"
              min="1"
              placeholder="e.g., 11"
              value={formData.minutes}
              onChange={(e) => setFormData({ ...formData, minutes: e.target.value })}
              required
            />
            {formData.minutes && parseInt(formData.minutes) > 0 && (
              <p className="text-xs text-muted-foreground">
                Will be billed as: {Math.ceil(parseInt(formData.minutes) / 6) * 6} minutes
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the work performed..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="billingCode">Billing Code (Optional)</Label>
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
            <Label htmlFor="tags">Tags (Optional)</Label>
            <Input
              id="tags"
              placeholder="research, client-call, urgent (comma-separated)"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Entry'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
