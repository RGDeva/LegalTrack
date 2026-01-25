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
      
      // Convert contacts to leads for CRM pipeline using database CRM fields
      const contactLeads: Lead[] = data.map((contact: any) => ({
        id: contact.id,
        contactId: contact.id,
        contact: {
          id: contact.id,
          name: contact.name,
          email: contact.email,
          phone: contact.phone || '',
          organization: contact.organization || '',
        },
        crmStage: (contact.crmStage || 'open') as 'open' | 'contacted' | 'negotiation' | 'closed',
        source: (contact.crmSource || 'other') as any,
        value: contact.crmValue || 0,
        probability: contact.crmProbability,
        expectedCloseDate: contact.crmExpectedCloseDate,
        notes: contact.notes || '',
        createdDate: contact.createdAt || new Date().toISOString(),
        lastActivityDate: contact.crmLastActivityDate
      }));
      
      setLeads(contactLeads);
    } catch (error) {
      console.error('Error loading contacts:', error);
      sonnerToast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleLeadCreate = async (newLead: Partial<Lead>) => {
    try {
      const token = localStorage.getItem('authToken');
      // Update the contact with CRM fields
      const res = await fetch(`${API_URL}/contacts/${newLead.contactId}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          crmStage: newLead.crmStage,
          crmSource: newLead.source,
          crmValue: newLead.value,
          crmProbability: newLead.probability,
          crmExpectedCloseDate: newLead.expectedCloseDate,
          crmLastActivityDate: new Date().toISOString()
        })
      });
      
      if (res.ok) {
        // Reload contacts to get updated data
        await loadContacts();
        toast({
          title: "Lead Created",
          description: "Lead has been added to the pipeline.",
        });
      }
    } catch (error) {
      console.error('Error creating lead:', error);
      sonnerToast.error('Failed to create lead');
    }
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
        onLeadUpdate={async (updated) => {
          setLeads(updated);
          // Find the lead that changed and persist to backend
          const token = localStorage.getItem('authToken');
          for (const lead of updated) {
            const original = leads.find(l => l.id === lead.id);
            if (original && original.crmStage !== lead.crmStage) {
              try {
                await fetch(`${API_URL}/contacts/${lead.id}`, {
                  method: 'PUT',
                  headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    crmStage: lead.crmStage,
                    crmLastActivityDate: new Date().toISOString()
                  })
                });
              } catch (error) {
                console.error('Error updating lead stage:', error);
              }
            }
          }
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
