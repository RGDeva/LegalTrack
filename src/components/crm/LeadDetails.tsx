import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Lead } from "@/types";
import { Mail, Phone, Building2, DollarSign, Calendar, Target, TrendingUp, FileText } from "lucide-react";

interface LeadDetailsProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LeadDetails = ({ lead, open, onOpenChange }: LeadDetailsProps) => {
  if (!lead) return null;

  const stageColors = {
    open: "bg-info text-info-foreground",
    contacted: "bg-warning text-warning-foreground",
    negotiation: "bg-purple-500 text-white",
    closed: "bg-success text-success-foreground",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">{lead.contact.name}</DialogTitle>
              {lead.contact.title && (
                <p className="text-sm text-muted-foreground mt-1">{lead.contact.title}</p>
              )}
            </div>
            <Badge className={stageColors[lead.crmStage]}>
              {lead.crmStage.charAt(0).toUpperCase() + lead.crmStage.slice(1)}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contact Information */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Contact Information
            </h3>
            <div className="space-y-2">
              {lead.contact.organization && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{lead.contact.organization}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${lead.contact.email}`} className="hover:underline">
                  {lead.contact.email}
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${lead.contact.phone}`} className="hover:underline">
                  {lead.contact.phone}
                </a>
              </div>
            </div>
          </div>

          <Separator />

          {/* Lead Details */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Lead Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Source</p>
                <p className="text-sm font-medium capitalize">
                  {lead.source.replace('-', ' ')}
                </p>
              </div>
              {lead.value && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Estimated Value</p>
                  <div className="flex items-center gap-1 text-sm font-medium text-success">
                    <DollarSign className="h-4 w-4" />
                    {lead.value.toLocaleString()}
                  </div>
                </div>
              )}
              {lead.probability !== undefined && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Probability</p>
                  <div className="flex items-center gap-1 text-sm font-medium">
                    <TrendingUp className="h-4 w-4" />
                    {lead.probability}%
                  </div>
                </div>
              )}
              {lead.expectedCloseDate && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Expected Close Date</p>
                  <div className="flex items-center gap-1 text-sm font-medium">
                    <Calendar className="h-4 w-4" />
                    {new Date(lead.expectedCloseDate).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Timeline */}
          <div>
            <h3 className="font-semibold mb-3">Timeline</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">
                  {new Date(lead.createdDate).toLocaleDateString()}
                </span>
              </div>
              {lead.lastActivityDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Activity</span>
                  <span className="font-medium">
                    {new Date(lead.lastActivityDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {lead.notes && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Notes</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {lead.notes}
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
