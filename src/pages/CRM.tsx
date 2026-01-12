import { useState, useEffect } from "react";
import { ContactKanban } from "@/components/contacts/ContactKanban";
import { LeadDialog } from "@/components/crm/LeadDialog";
import { LeadDetails } from "@/components/crm/LeadDetails";
import { useToast } from "@/hooks/use-toast";
import { Lead, Contact } from "@/types";
import { API_URL } from "@/lib/api-url";
import { toast as sonnerToast } from "sonner";

const CRM = () => {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

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
      const data = await res.json();
      setContacts(data);
      
      // Convert contacts to leads for CRM pipeline
      const contactLeads: Lead[] = data.map((contact: any) => ({
        id: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone || '',
        company: contact.organization || '',
        stage: 'new' as const,
        value: 0,
        source: 'contact',
        assignedTo: '',
        notes: contact.notes || '',
        createdAt: contact.createdAt || new Date().toISOString()
      }));
      
      setLeads(contactLeads);
    } catch (error) {
      console.error('Error loading contacts:', error);
      sonnerToast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleLeadCreate = (newLead: Partial<Lead>) => {
    setLeads([...leads, newLead as Lead]);
    toast({
      title: "Lead Created",
      description: "New lead has been added successfully.",
    });
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setDetailsOpen(true);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">CRM Pipeline</h1>
          <p className="text-muted-foreground">Loading contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">CRM Pipeline</h1>
          <p className="text-muted-foreground">Track and manage your lead pipeline</p>
        </div>
        <LeadDialog contacts={contacts} onSave={handleLeadCreate} />
      </div>

      <ContactKanban 
        leads={leads} 
        onLeadUpdate={(updated) => {
          setLeads(updated);
          toast({
            title: "Lead Updated",
            description: "Lead stage updated successfully.",
          });
        }}
        onLeadClick={handleLeadClick}
      />

      <LeadDetails 
        lead={selectedLead}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  );
};

export default CRM;
