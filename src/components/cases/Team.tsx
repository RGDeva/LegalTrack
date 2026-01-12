import { useState } from "react";
import { UserPlus, X, Mail, Phone, Briefcase } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TeamMember {
  id: string;
  staffId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  caseRole: string;
  billableRate: number;
}

interface TeamProps {
  caseId: string;
}

const caseRoles = [
  "Lead Attorney",
  "Co-Counsel",
  "Associate Attorney",
  "Junior Associate",
  "Paralegal",
  "Legal Assistant",
  "Of Counsel"
];

const Team = ({ caseId }: TeamProps) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: "tm-1",
      staffId: "staff1",
      name: "Sarah Johnson",
      email: "sjohnson@legaltrack.com",
      phone: "(555) 123-4567",
      role: "Senior Partner",
      caseRole: "Lead Attorney",
      billableRate: 450
    },
    {
      id: "tm-2",
      staffId: "staff3",
      name: "Emily Rodriguez",
      email: "erodriguez@legaltrack.com",
      phone: "(555) 345-6789",
      role: "Paralegal",
      caseRole: "Paralegal",
      billableRate: 125
    }
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [selectedCaseRole, setSelectedCaseRole] = useState<string>("");

  const availableStaff = [].filter(
    staff => !teamMembers.some(tm => tm.staffId === staff.id) && staff.status === "active"
  );

  const handleAddMember = () => {
    if (!selectedStaffId || !selectedCaseRole) return;

    const staff = [].find(s => s.id === selectedStaffId);
    if (!staff) return;

    const newMember: TeamMember = {
      id: `tm-${Date.now()}`,
      staffId: staff.id,
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      role: staff.role,
      caseRole: selectedCaseRole,
      billableRate: staff.billableRate
    };

    setTeamMembers([...teamMembers, newMember]);
    setSelectedStaffId("");
    setSelectedCaseRole("");
    setDialogOpen(false);
  };

  const handleRemoveMember = (memberId: string) => {
    setTeamMembers(teamMembers.filter(tm => tm.id !== memberId));
  };

  const handleUpdateRole = (memberId: string, newRole: string) => {
    setTeamMembers(teamMembers.map(tm =>
      tm.id === memberId ? { ...tm, caseRole: newRole } : tm
    ));
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Case Team</CardTitle>
            <CardDescription>
              Attorneys and staff assigned to this case
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Team Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Team Member</DialogTitle>
                <DialogDescription>
                  Assign an attorney or staff member to this case
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Staff Member</label>
                  <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStaff.map(staff => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.name} - {staff.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Case Role</label>
                  <Select value={selectedCaseRole} onValueChange={setSelectedCaseRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role on this case" />
                    </SelectTrigger>
                    <SelectContent>
                      {caseRoles.map(role => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleAddMember} 
                  disabled={!selectedStaffId || !selectedCaseRole}
                  className="w-full"
                >
                  Add to Team
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {teamMembers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No team members assigned to this case yet
          </div>
        ) : (
          <div className="space-y-4">
            {teamMembers.map(member => (
              <div
                key={member.id}
                className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{member.name}</h4>
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMember(member.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${member.email}`} className="hover:text-primary">
                        {member.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${member.phone}`} className="hover:text-primary">
                        {member.phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Briefcase className="h-4 w-4" />
                      <span>${member.billableRate}/hr</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Case Role:</span>
                    <Select
                      value={member.caseRole}
                      onValueChange={(value) => handleUpdateRole(member.id, value)}
                    >
                      <SelectTrigger className="w-[200px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {caseRoles.map(role => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Team;
