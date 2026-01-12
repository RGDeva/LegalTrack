import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { API_URL } from '@/lib/api-url';

interface BillingCode {
  id: string;
  code: string;
  label: string;
  rateSource: string;
  fixedRateCents: number | null;
  overrideRole: string | null;
  active: boolean;
}

const BillingCodes = () => {
  const { user } = useAuth();
  const [codes, setCodes] = useState<BillingCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<BillingCode | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    label: '',
    rateSource: 'roleRate',
    fixedRateCents: '',
    overrideRole: ''
  });

  useEffect(() => {
    if (user?.role !== 'Admin') {
      toast.error('Access denied. Admin only.');
      return;
    }
    loadCodes();
  }, [user]);

  const loadCodes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/billing-codes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setCodes(data);
    } catch (error) {
      console.error('Error loading billing codes:', error);
      toast.error('Failed to load billing codes');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      label: '',
      rateSource: 'roleRate',
      fixedRateCents: '',
      overrideRole: ''
    });
    setEditingCode(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.label) {
      toast.error('Code and label are required');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const url = editingCode 
        ? `${API_URL}/billing-codes/${editingCode.id}`
        : `${API_URL}/billing-codes`;
      
      const res = await fetch(url, {
        method: editingCode ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: formData.code,
          label: formData.label,
          rateSource: formData.rateSource,
          fixedRateCents: formData.rateSource === 'fixedRate' && formData.fixedRateCents 
            ? parseInt(formData.fixedRateCents) 
            : null,
          overrideRole: formData.rateSource === 'roleRate' && formData.overrideRole 
            ? formData.overrideRole 
            : null,
          active: true
        })
      });

      if (res.ok) {
        toast.success(editingCode ? 'Billing code updated' : 'Billing code created');
        setIsAddDialogOpen(false);
        resetForm();
        loadCodes();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to save billing code');
      }
    } catch (error) {
      console.error('Error saving billing code:', error);
      toast.error('Failed to save billing code');
    }
  };

  const handleEdit = (code: BillingCode) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      label: code.label,
      rateSource: code.rateSource,
      fixedRateCents: code.fixedRateCents ? (code.fixedRateCents / 100).toString() : '',
      overrideRole: code.overrideRole || ''
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this billing code?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/billing-codes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success('Billing code deleted');
        loadCodes();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete billing code');
      }
    } catch (error) {
      console.error('Error deleting billing code:', error);
      toast.error('Failed to delete billing code');
    }
  };

  const formatRate = (code: BillingCode) => {
    if (code.rateSource === 'fixedRate' && code.fixedRateCents) {
      return `$${(code.fixedRateCents / 100).toFixed(2)}/hr (Fixed)`;
    } else if (code.rateSource === 'roleRate' && code.overrideRole) {
      return `${code.overrideRole} Rate`;
    } else {
      return 'User Role Rate';
    }
  };

  if (user?.role !== 'Admin') {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              Access denied. This page is only accessible to administrators.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Billing Codes</h1>
          <p className="text-muted-foreground">Manage billing codes for time tracking</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Billing Code
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCode ? 'Edit' : 'Add'} Billing Code</DialogTitle>
              <DialogDescription>
                Configure billing code settings. Codes are used for time entry billing.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  placeholder="e.g., 001"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="label">Label *</Label>
                <Input
                  id="label"
                  placeholder="e.g., Legal Research"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rateSource">Rate Source *</Label>
                <Select
                  value={formData.rateSource}
                  onValueChange={(value) => setFormData({ ...formData, rateSource: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="roleRate">Use Role Rate</SelectItem>
                    <SelectItem value="fixedRate">Fixed Rate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.rateSource === 'fixedRate' && (
                <div className="space-y-2">
                  <Label htmlFor="fixedRate">Fixed Rate ($/hour)</Label>
                  <Input
                    id="fixedRate"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 150.00"
                    value={formData.fixedRateCents}
                    onChange={(e) => setFormData({ ...formData, fixedRateCents: e.target.value })}
                  />
                </div>
              )}

              {formData.rateSource === 'roleRate' && (
                <div className="space-y-2">
                  <Label htmlFor="overrideRole">Override Role (Optional)</Label>
                  <Select
                    value={formData.overrideRole || undefined}
                    onValueChange={(value) => setFormData({ ...formData, overrideRole: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Use user's role (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Attorney">Attorney</SelectItem>
                      <SelectItem value="Paralegal">Paralegal</SelectItem>
                      <SelectItem value="Legal Assistant">Legal Assistant</SelectItem>
                      <SelectItem value="Staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCode ? 'Update' : 'Create'} Code
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Billing Codes ({codes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading billing codes...</p>
          ) : codes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No billing codes yet. Create your first billing code to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell className="font-mono font-medium">{code.code}</TableCell>
                    <TableCell>{code.label}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatRate(code)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={code.active ? 'default' : 'secondary'}>
                        {code.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(code)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDelete(code.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingCodes;
