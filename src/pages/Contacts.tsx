import { useState, useEffect } from "react";
import { Plus, Search, Filter, Phone, Mail, Building2, User, RefreshCw, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

  const [loading, setLoading] = useState(true);

  // Load contacts from API
  useEffect(() => {
    loadContacts();
    checkGoogleStatus();
  }, []);

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
      const res = await fetch(`${API_URL}/contacts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setContacts(Array.isArray(data) ? data : []);
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
    const variants = {
      client: "bg-success text-success-foreground",
      'opposing-counsel': "bg-destructive text-destructive-foreground",
      court: "bg-info text-info-foreground",
      expert: "bg-warning text-warning-foreground",
      vendor: "bg-secondary text-secondary-foreground",
      other: "bg-muted text-muted-foreground",
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
        <div className="flex gap-2">
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredContacts.map((contact) => (
          <Card key={contact.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
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

      {filteredContacts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No contacts found matching your search criteria.</p>
        </div>
      )}
    </div>
  );
};

export default Contacts;