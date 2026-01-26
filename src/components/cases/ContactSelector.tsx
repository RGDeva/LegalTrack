import { useState, useEffect } from "react";
import { Plus, Search, UserPlus, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Contact } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { API_URL } from "@/lib/api-url";

interface ContactSelectorProps {
  selectedContact?: Contact;
  onContactSelect: (contact: Contact) => void;
  onContactAdd?: (contact: Contact) => void;
}

const ContactSelector: React.FC<ContactSelectorProps> = ({ 
  selectedContact, 
  onContactSelect,
  onContactAdd 
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Load contacts from API on mount
  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/contacts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setContacts(data);
        } else {
          setContacts([]);
        }
      } else {
        setContacts([]);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

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

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contact.organization?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  const handleAddContact = () => {
    if (!newContact.name || !newContact.email || !newContact.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const contact: Contact = {
      id: `contact-${Date.now()}`,
      name: newContact.name!,
      email: newContact.email!,
      phone: newContact.phone!,
      organization: newContact.organization,
      title: newContact.title,
      category: newContact.category as Contact['category'],
      notes: newContact.notes,
      address: newContact.address,
      lastContact: new Date().toISOString().split('T')[0],
    };

    setContacts([...contacts, contact]);
    onContactSelect(contact);
    if (onContactAdd) {
      onContactAdd(contact);
    }
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

    toast({
      title: "Contact Added",
      description: `${contact.name} has been added and selected as the primary contact.`,
    });
  };

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="justify-between flex-1"
          >
            {selectedContact ? selectedContact.name : "Select contact..."}
            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput 
              placeholder="Search contacts..." 
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandEmpty>
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-3">No contact found.</p>
                <Button 
                  size="sm" 
                  onClick={() => {
                    setOpen(false);
                    setIsAddDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Contact
                </Button>
              </div>
            </CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-auto">
              {filteredContacts.map((contact) => (
                <CommandItem
                  key={contact.id}
                  value={contact.name}
                  onSelect={() => {
                    onContactSelect(contact);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedContact?.id === contact.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{contact.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {contact.email} • {contact.organization || contact.category}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon">
            <UserPlus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
            <DialogDescription>
              Create a new contact and assign them to this case. Fields marked with * are required.
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
              Add Contact & Assign to Case
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContactSelector;