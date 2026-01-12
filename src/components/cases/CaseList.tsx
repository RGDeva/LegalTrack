import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Search, Filter } from "lucide-react";
import { Case } from "@/types";
import { EditCaseDialog } from "./EditCaseDialog";
import { DeleteCaseDialog } from "./DeleteCaseDialog";
import { toast } from "sonner";
import { API_URL } from '@/lib/api-url';
export function CaseList() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);

  // Load cases from API
  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
            const res = await fetch(`${API_URL}/cases`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setCases(data);
    } catch (error) {
      console.error('Error loading cases:', error);
      toast.error('Failed to load cases');
    } finally {
      setLoading(false);
    }
  };

  const handleCaseUpdated = () => {
    // Reload cases from API
    loadCases();
  };
  const filteredCases = cases.filter(case_ => {
    const matchesSearch = case_.title.toLowerCase().includes(searchTerm.toLowerCase()) || case_.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) || case_.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || case_.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const getStatusBadge = (status: Case['status']) => {
    const variants = {
      active: "bg-success text-success-foreground",
      pending: "bg-warning text-warning-foreground",
      closed: "bg-muted text-muted-foreground",
      'on-hold': "bg-info text-info-foreground"
    };
    return <Badge className={variants[status]}>{status}</Badge>;
  };
  const getPriorityBadge = (priority: Case['priority']) => {
    const variants = {
      low: "bg-muted text-muted-foreground",
      medium: "bg-info text-info-foreground",
      high: "bg-warning text-warning-foreground",
      urgent: "bg-destructive text-destructive-foreground"
    };
    return <Badge className={variants[priority]}>{priority}</Badge>;
  };
  if (loading) {
    return <div className="flex items-center justify-center p-8">
      <p className="text-muted-foreground">Loading cases...</p>
    </div>;
  }

  return <div className="space-y-4">
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search cases..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cases</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="on-hold">On Hold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Case Number</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Lead Attorney</TableHead>
              <TableHead>Next Event</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCases.map(case_ => <TableRow key={case_.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate(`/cases/${case_.id}`)}>
                <TableCell className="font-medium">{case_.caseNumber}</TableCell>
                <TableCell>{case_.title}</TableCell>
                <TableCell>{case_.clientName}</TableCell>
                <TableCell>{case_.type}</TableCell>
                <TableCell>{getStatusBadge(case_.status)}</TableCell>
                <TableCell>{getPriorityBadge(case_.priority)}</TableCell>
                <TableCell>{case_.assignedTo}</TableCell>
                <TableCell>{case_.nextHearing || '-'}</TableCell>
                <TableCell>
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/cases/${case_.id}`)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <EditCaseDialog case={case_} onCaseUpdated={handleCaseUpdated} />
                    <DeleteCaseDialog case={case_} onCaseDeleted={handleCaseUpdated} />
                  </div>
                </TableCell>
              </TableRow>)}
          </TableBody>
        </Table>
      </div>
    </div>;
}