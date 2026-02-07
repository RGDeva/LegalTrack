import { useState, useEffect, useRef } from "react";
import { Plus, Search, Filter, Phone, Mail, Building2, User, RefreshCw, Loader2, LayoutGrid, List, Trash2, Upload, FileSpreadsheet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Contact } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { EditContactDialog } from "@/components/contacts/EditContactDialog";
import { DeleteContactDialog } from "@/components/contacts/DeleteContactDialog";
import { API_URL } from '@/lib/api-url';

const Contacts = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalContacts, setTotalContacts] = useState(0);
  const contactsPerPage = 50;

  const [loading, setLoading] = useState(true);

  // Load contacts from API
  useEffect(() => {
    loadContacts();
    checkGoogleStatus();
  }, [currentPage]);

  const checkGoogleStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/google-contacts/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGoogleConnected(data.isConnected);
      }
    } catch (error) {
      console.error('Error checking Google status:', error);
    }
  };

  const syncGoogleContacts = async () => {
    setSyncing(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/google-contacts/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ syncDirection: 'one_way' })
      });
      if (res.ok) {
        const data = await res.json();
        sonnerToast.success(`Synced: ${data.imported} imported, ${data.updated} updated, ${data.skipped} skipped`);
        loadContacts();
      } else {
        const err = await res.json().catch(() => ({}));
        sonnerToast.error(err.error || 'Sync failed');
      }
    } catch (error) {
      console.error('Error syncing Google contacts:', error);
      sonnerToast.error('Failed to sync Google contacts');
    } finally {
      setSyncing(false);
    }
  };

  const connectGoogle = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/google-contacts/auth-url`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.url;
      } else {
        sonnerToast.error('Failed to start Google connection. Check server config.');
      }
    } catch {
      sonnerToast.error('Failed to connect to Google');
    }
  };

  const loadContacts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/contacts?page=${currentPage}&limit=${contactsPerPage}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        // Legacy response format
        setContacts(data);
        setTotalPages(1);
        setTotalContacts(data.length);
      } else if (data.contacts) {
        setContacts(Array.isArray(data.contacts) ? data.contacts : []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalContacts(data.pagination?.total || 0);
      } else {
        setContacts([]);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
      sonnerToast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleContactUpdated = () => {
    loadContacts();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredContacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredContacts.map(c => c.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkDeleting(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/contacts/bulk-delete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: Array.from(selectedIds) })
      });
      if (res.ok) {
        const data = await res.json();
        sonnerToast.success(`${data.count} contacts deleted`);
        setSelectedIds(new Set());
        loadContacts();
      } else {
        const err = await res.json().catch(() => ({}));
        sonnerToast.error(err.error || 'Failed to delete contacts');
      }
    } catch (error) {
      console.error('Error bulk deleting:', error);
      sonnerToast.error('Failed to delete contacts');
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_URL}/contacts/import`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        sonnerToast.success(`${data.imported} contacts imported, ${data.skipped} skipped`);
        setIsImportDialogOpen(false);
        loadContacts();
      } else {
        sonnerToast.error(data.error || 'Import failed');
      }
    } catch (error) {
      console.error('Error importing contacts:', error);
      sonnerToast.error('Failed to import contacts');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newContact, setNewContact] = useState<Partial<Contact>>({
    name: "",
    email: "",
    phone: "",
    organization: "",
    title: "",
    category: "client",
    notes: "",
    address: "",
  });

  const getCategoryBadge = (category?: Contact['category']) => {
    if (!category) return <Badge className="bg-muted text-muted-foreground">other</Badge>;
    const variants: Record<string, string> = {
      client: "bg-success text-success-foreground",
      'opposing-counsel': "bg-destructive text-destructive-foreground",
      court: "bg-info text-info-foreground",
      expert: "bg-warning text-warning-foreground",
      vendor: "bg-secondary text-secondary-foreground",
      other: "bg-muted text-muted-foreground",
      imported: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    };
    return <Badge className={variants[category]}>{category.replace('-', ' ')}</Badge>;
  };

  const getCategoryIcon = (category?: Contact['category']) => {
    switch (category) {
      case 'client': return <User className="h-4 w-4" />;
      case 'opposing-counsel': return <User className="h-4 w-4" />;
      case 'court': return <Building2 className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (contact.organization?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || contact.category === categoryFilter || (!contact.category && categoryFilter === "other");
    return matchesSearch && matchesCategory;
  });

  const handleAddContact = async () => {
    if (!newContact.name || !newContact.email || !newContact.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/contacts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newContact.name,
          email: newContact.email,
          phone: newContact.phone,
          mobile: null,
          organization: newContact.organization || null,
          title: newContact.title || null,
          role: null,
          address: newContact.address || null,
          city: null,
          state: null,
          zip: null,
          category: newContact.category || 'client',
          notes: newContact.notes || null,
          lastContact: new Date(),
          tags: []
        })
      });

      if (res.ok) {
        const contact = await res.json();
        toast({
          title: "Contact Added",
          description: `${contact.name} has been added to your contacts.`,
        });
        setIsAddDialogOpen(false);
        setNewContact({
          name: "",
          email: "",
          phone: "",
          organization: "",
          title: "",
          category: "client",
          notes: "",
          address: "",
        });
        loadContacts();
      } else {
        const data = await res.json();
        sonnerToast.error(data.error || 'Failed to add contact');
      }
    } catch (error) {
      console.error('Error adding contact:', error);
      sonnerToast.error('Failed to add contact');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Contacts</h1>
          <p className="text-muted-foreground">Manage your contacts and connections</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {selectedIds.size > 0 && (
            <Button variant="destructive" onClick={handleBulkDelete} disabled={bulkDeleting}>
              {bulkDeleting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Deleting...</>
              ) : (
                <><Trash2 className="h-4 w-4 mr-2" />Delete ({selectedIds.size})</>
              )}
            </Button>
          )}
          {googleConnected ? (
            <Button variant="outline" onClick={syncGoogleContacts} disabled={syncing}>
              {syncing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Syncing...</>
              ) : (
                <><RefreshCw className="h-4 w-4 mr-2" />Sync Google Contacts</>
              )}
            </Button>
          ) : (
            <Button variant="outline" onClick={connectGoogle}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Connect Google
            </Button>
          )}
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Contacts</DialogTitle>
                <DialogDescription>
                  Upload a CSV or Excel file to import contacts. The file should have columns like: name, email, phone, organization, title, category, address, notes.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-4">
                  <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Drop your file here or click to browse</p>
                    <p className="text-xs text-muted-foreground mt-1">Supports .csv, .xls, .xlsx (max 5MB)</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xls,.xlsx"
                    onChange={handleImportFile}
                    className="hidden"
                    id="import-file"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={importing}
                  >
                    {importing ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importing...</>
                    ) : (
                      <>Choose File</>
                    )}
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-medium">Supported column headers:</p>
                  <p>name, email, phone, organization/company, title, category, address, notes</p>
                  <p>Duplicate emails will be skipped automatically.</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient">
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Contact</DialogTitle>
              <DialogDescription>
                Enter the contact information below. Fields marked with * are required.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newContact.title}
                  onChange={(e) => setNewContact({ ...newContact, title: e.target.value })}
                  placeholder="CEO, Attorney, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organization">Organization</Label>
                <Input
                  id="organization"
                  value={newContact.organization}
                  onChange={(e) => setNewContact({ ...newContact, organization: e.target.value })}
                  placeholder="Company Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={newContact.category} 
                  onValueChange={(value) => setNewContact({ ...newContact, category: value as Contact['category'] })}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="opposing-counsel">Opposing Counsel</SelectItem>
                    <SelectItem value="court">Court</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                    <SelectItem value="vendor">Vendor</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={newContact.address}
                  onChange={(e) => setNewContact({ ...newContact, address: e.target.value })}
                  placeholder="123 Main St, City, State 12345"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newContact.notes}
                  onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                  placeholder="Additional notes about this contact..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddContact}>
                Add Contact
              </Button>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts by name, email, or organization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="client">Clients</SelectItem>
            <SelectItem value="opposing-counsel">Opposing Counsel</SelectItem>
            <SelectItem value="court">Court</SelectItem>
            <SelectItem value="expert">Experts</SelectItem>
            <SelectItem value="vendor">Vendors</SelectItem>
            <SelectItem value="other">Other</SelectItem>
            <SelectItem value="imported">Imported (Google)</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex border rounded-md">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
            className="rounded-r-none"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
            className="rounded-l-none"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map((contact) => (
            <Card key={contact.id} className={`hover:shadow-lg transition-shadow cursor-pointer ${selectedIds.has(contact.id) ? 'ring-2 ring-primary' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedIds.has(contact.id)}
                      onCheckedChange={() => toggleSelect(contact.id)}
                      className="mt-1"
                    />
                    <div className="p-2 rounded-lg bg-muted">
                      {getCategoryIcon(contact.category)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{contact.name}</CardTitle>
                      {contact.title && (
                        <p className="text-sm text-muted-foreground">{contact.title}</p>
                      )}
                      {contact.organization && (
                        <p className="text-sm font-medium text-muted-foreground">{contact.organization}</p>
                      )}
                    </div>
                  </div>
                  {getCategoryBadge(contact.category)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex gap-1 pb-2 border-b">
                    <EditContactDialog contact={contact} onContactUpdated={handleContactUpdated} />
                    <DeleteContactDialog contact={contact} onContactDeleted={handleContactUpdated} />
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                      {contact.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <a href={`tel:${contact.phone}`} className="text-primary hover:underline">
                      {contact.phone}
                    </a>
                  </div>
                  {contact.mobile && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <a href={`tel:${contact.mobile}`} className="text-primary hover:underline">
                        {contact.mobile} (Mobile)
                      </a>
                    </div>
                  )}
                  {contact.address && (
                    <p className="text-sm text-muted-foreground">{contact.address}</p>
                  )}
                  {contact.lastContact && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Last contact: {contact.lastContact}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={filteredContacts.length > 0 && selectedIds.size === filteredContacts.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map((contact) => (
                <TableRow key={contact.id} className={selectedIds.has(contact.id) ? 'bg-muted/50' : ''}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(contact.id)}
                      onCheckedChange={() => toggleSelect(contact.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{contact.name}</p>
                      {contact.title && <p className="text-xs text-muted-foreground">{contact.title}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <a href={`mailto:${contact.email}`} className="text-primary hover:underline text-sm">
                      {contact.email}
                    </a>
                  </TableCell>
                  <TableCell>
                    {contact.phone && (
                      <a href={`tel:${contact.phone}`} className="text-primary hover:underline text-sm">
                        {contact.phone}
                      </a>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{contact.organization || '—'}</TableCell>
                  <TableCell>{getCategoryBadge(contact.category)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <EditContactDialog contact={contact} onContactUpdated={handleContactUpdated} />
                      <DeleteContactDialog contact={contact} onContactDeleted={handleContactUpdated} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {filteredContacts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No contacts found matching your search criteria.</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * contactsPerPage) + 1}–{Math.min(currentPage * contactsPerPage, totalContacts)} of {totalContacts} contacts
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => { setCurrentPage(1); setSelectedIds(new Set()); }}
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => { setCurrentPage(p => p - 1); setSelectedIds(new Set()); }}
            >
              Previous
            </Button>
            <span className="flex items-center px-3 text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => { setCurrentPage(p => p + 1); setSelectedIds(new Set()); }}
            >
              Next
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => { setCurrentPage(totalPages); setSelectedIds(new Set()); }}
            >
              Last
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contacts;