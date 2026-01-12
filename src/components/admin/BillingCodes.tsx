import { useState } from 'react';
import { Plus, Edit2, Trash2, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { BillingCode } from '@/types';
import { toast } from 'sonner';

export function BillingCodes() {
  const { user } = useAuth();
  const [billingCodes, setBillingCodes] = useState<BillingCode[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<BillingCode | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    label: '',
    attorneyRate: '',
    staffRate: ''
  });

  const isAdmin = user?.role === 'Admin';

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You need admin privileges to manage billing codes.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code || !formData.label) {
      toast.error('Please fill in all required fields');
      return;
    }

    const roleRatePolicy = {
      'Admin': parseInt(formData.attorneyRate) * 100 || 0, // Admin uses attorney rate
      'Attorney': parseInt(formData.attorneyRate) * 100 || 0,
      'Staff': parseInt(formData.staffRate) * 100 || 0
    };

    if (editingCode) {
      // Update existing code
      setBillingCodes(codes => codes.map(code => 
        code.id === editingCode.id 
          ? { ...code, code: formData.code, label: formData.label, roleRatePolicy }
          : code
      ));
      toast.success('Billing code updated');
    } else {
      // Create new code
      const newCode: BillingCode = {
        id: Date.now().toString(),
        code: formData.code,
        label: formData.label,
        roleRatePolicy,
        active: true,
        createdAt: new Date().toISOString()
      };
      setBillingCodes(codes => [...codes, newCode]);
      toast.success('Billing code created');
    }

    setIsDialogOpen(false);
    setEditingCode(null);
    setFormData({ code: '', label: '', attorneyRate: '', staffRate: '' });
  };

  const handleEdit = (code: BillingCode) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      label: code.label,
      attorneyRate: (code.roleRatePolicy['Attorney'] / 100).toString(),
      staffRate: (code.roleRatePolicy['Staff'] / 100).toString()
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setBillingCodes(codes => codes.filter(code => code.id !== id));
    toast.success('Billing code deleted');
  };

  const openCreateDialog = () => {
    setEditingCode(null);
    setFormData({ code: '', label: '', attorneyRate: '', staffRate: '' });
    setIsDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billing Codes</h1>
          <p className="text-muted-foreground">Manage billing codes and rate policies</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Billing Code
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCode ? 'Edit Billing Code' : 'Create Billing Code'}
              </DialogTitle>
              <DialogDescription>
                Set up billing codes with different rates for each role.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g., 003"
                    maxLength={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="label">Label *</Label>
                  <Input
                    id="label"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder="e.g., Court Appearance"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium">Hourly Rates by Role</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="attorneyRate">Attorney/Admin ($)</Label>
                    <Input
                      id="attorneyRate"
                      type="number"
                      value={formData.attorneyRate}
                      onChange={(e) => setFormData({ ...formData, attorneyRate: e.target.value })}
                      placeholder="350"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staffRate">Staff ($)</Label>
                    <Input
                      id="staffRate"
                      type="number"
                      value={formData.staffRate}
                      onChange={(e) => setFormData({ ...formData, staffRate: e.target.value })}
                      placeholder="75"
                    />
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCode ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Billing Codes
          </CardTitle>
          <CardDescription>
            Manage billing codes and their associated rates for different roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Attorney/Admin Rate</TableHead>
                  <TableHead>Staff Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingCodes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell className="font-mono font-medium">
                      {code.code}
                    </TableCell>
                    <TableCell>{code.label}</TableCell>
                    <TableCell>
                      ${(code.roleRatePolicy['Attorney'] / 100).toFixed(2)}/hr
                    </TableCell>
                    <TableCell>
                      ${(code.roleRatePolicy['Staff'] / 100).toFixed(2)}/hr
                    </TableCell>
                    <TableCell>
                      <Badge variant={code.active ? "default" : "secondary"}>
                        {code.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(code)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
