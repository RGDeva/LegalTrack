import { useState } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, useDroppable, useDraggable } from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Building2, DollarSign, Calendar } from "lucide-react";
import { Lead } from "@/types";

type CRMStage = "open" | "contacted" | "negotiation" | "closed";

interface LeadKanbanProps {
  leads: Lead[];
  onLeadUpdate: (leads: Lead[]) => void;
  onLeadClick?: (lead: Lead) => void;
}

const DraggableLead = ({ lead, onClick }: { lead: Lead; onClick?: (lead: Lead) => void }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
      onClick={(e) => {
        if (onClick && !isDragging) {
          e.stopPropagation();
          onClick(lead);
        }
      }}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{lead.contact.name}</CardTitle>
        {lead.contact.organization && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Building2 className="h-3 w-3" />
            {lead.contact.organization}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Mail className="h-3 w-3" />
          <span className="truncate">{lead.contact.email}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Phone className="h-3 w-3" />
          {lead.contact.phone}
        </div>
        {lead.value && (
          <div className="flex items-center gap-1 text-xs font-medium text-success">
            <DollarSign className="h-3 w-3" />
            {lead.value.toLocaleString()}
          </div>
        )}
        {lead.expectedCloseDate && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {new Date(lead.expectedCloseDate).toLocaleDateString()}
          </div>
        )}
        {lead.probability !== undefined && (
          <Badge variant="outline" className="text-xs">
            {lead.probability}% probability
          </Badge>
        )}
        <div className="text-xs text-muted-foreground capitalize">
          Source: {lead.source.replace('-', ' ')}
        </div>
      </CardContent>
    </Card>
  );
};

const KanbanColumn = ({ 
  title, 
  stage, 
  leads,
  onLeadClick
}: { 
  title: string; 
  stage: CRMStage; 
  leads: Lead[];
  onLeadClick?: (lead: Lead) => void;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
  });

  const stageColors = {
    open: "bg-info/10 border-info",
    contacted: "bg-warning/10 border-warning",
    negotiation: "bg-purple-500/10 border-purple-500",
    closed: "bg-success/10 border-success",
  };

  const totalValue = leads.reduce((sum, lead) => sum + (lead.value || 0), 0);

  return (
    <div className="flex-1 min-w-[280px]">
      <div className={`rounded-lg border-2 ${stageColors[stage]} ${isOver ? 'ring-2 ring-primary' : ''} p-4 h-full transition-all`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg">{title}</h3>
          <Badge variant="secondary">{leads.length}</Badge>
        </div>
        {totalValue > 0 && (
          <div className="text-sm font-medium text-muted-foreground mb-4">
            ${totalValue.toLocaleString()}
          </div>
        )}
        <div ref={setNodeRef} className="space-y-3 min-h-[200px]">
          {leads.map((lead) => (
            <DraggableLead key={lead.id} lead={lead} onClick={onLeadClick} />
          ))}
        </div>
      </div>
    </div>
  );
};

export const ContactKanban = ({ leads, onLeadUpdate, onLeadClick }: LeadKanbanProps) => {
  const [leadsState, setLeadsState] = useState<Lead[]>(leads);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    const leadId = active.id as string;
    const newStage = over.id as CRMStage;

    const updatedLeads = leadsState.map(lead => 
      lead.id === leadId ? { ...lead, crmStage: newStage } : lead
    );
    
    setLeadsState(updatedLeads);
    onLeadUpdate(updatedLeads);
    setActiveId(null);
  };

  const stages: { stage: CRMStage; title: string }[] = [
    { stage: "open", title: "Open" },
    { stage: "contacted", title: "Contacted" },
    { stage: "negotiation", title: "Negotiation" },
    { stage: "closed", title: "Closed" },
  ];

  const activeLead = activeId ? leadsState.find(l => l.id === activeId) : null;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map(({ stage, title }) => (
          <KanbanColumn
            key={stage}
            title={title}
            stage={stage}
            leads={leadsState.filter(l => l.crmStage === stage)}
            onLeadClick={onLeadClick}
          />
        ))}
      </div>
      <DragOverlay>
        {activeLead ? (
          <Card className="cursor-grabbing shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{activeLead.contact.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{activeLead.contact.email}</p>
            </CardContent>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
