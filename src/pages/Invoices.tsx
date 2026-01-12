import { useState } from "react";
import { Plus, Eye, Edit, Send, Download, MoreVertical, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InvoiceDialog } from "@/components/invoices/InvoiceDialog";
import { InvoiceDetails } from "@/components/invoices/InvoiceDetails";
import { InvoiceBuilder } from "@/components/invoices/InvoiceBuilder";
import { useToast } from "@/hooks/use-toast";
import { generateInvoiceFromTimeEntries, downloadInvoice, markTimeEntriesAsBilled } from "@/lib/invoice-generator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Invoices = () => {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [selectedCaseForInvoice, setSelectedCaseForInvoice] = useState<string>("");

  const filteredInvoices = invoices.filter(inv => 
    statusFilter === "all" || inv.status === statusFilter
  );

  const stats = {
    total: invoices.reduce((sum, inv) => sum + inv.total, 0),
    paid: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0),
    outstanding: invoices.filter(inv => inv.status !== 'paid').reduce((sum, inv) => sum + inv.balance, 0),
    overdue: invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.balance, 0),
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      draft: "bg-muted text-muted-foreground",
      sent: "bg-info text-info-foreground",
      paid: "bg-success text-success-foreground",
      overdue: "bg-destructive text-destructive-foreground",
      partial: "bg-warning text-warning-foreground",
    };
    return <Badge className={variants[status]}>{status}</Badge>;
  };

  const handleCreateInvoice = () => {
    setEditingInvoice(null);
    setShowCreateDialog(true);
  };

  const handleEditInvoice = (invoice: any) => {
    setEditingInvoice(invoice);
    setShowCreateDialog(true);
  };

  const handleViewInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setShowDetailsDialog(true);
  };

  const handleSaveInvoice = (invoice: any) => {
    if (editingInvoice) {
      setInvoices(invoices.map(inv => inv.id === invoice.id ? invoice : inv));
      toast({ title: "Invoice updated successfully" });
    } else {
      setInvoices([invoice, ...invoices]);
      toast({ title: "Invoice created successfully" });
    }
  };

  const handleSendInvoice = (invoice: any) => {
    setInvoices(invoices.map(inv => 
      inv.id === invoice.id ? { ...inv, status: 'sent' } : inv
    ));
    toast({ title: `Invoice ${invoice.invoiceNumber} sent to ${invoice.clientName}` });
  };

  const handleMarkAsPaid = (invoice: any) => {
    setInvoices(invoices.map(inv => 
      inv.id === invoice.id ? { ...inv, status: 'paid', amountPaid: inv.total, balance: 0 } : inv
    ));
    toast({ title: `Invoice ${invoice.invoiceNumber} marked as paid` });
  };

  const handleGenerateInvoice = () => {
    if (!selectedCaseForInvoice) {
      toast({ title: "Please select a case", variant: "destructive" });
      return;
    }

    const generatedInvoice = generateInvoiceFromTimeEntries(selectedCaseForInvoice);
    
    if (!generatedInvoice) {
      toast({ title: "No unbilled time entries found for this case", variant: "destructive" });
      return;
    }

    // Download the invoice
    downloadInvoice(generatedInvoice);
    
    // Mark entries as billed
    markTimeEntriesAsBilled(selectedCaseForInvoice);
    
    toast({ 
      title: "Invoice generated successfully",
      description: `Total: $${generatedInvoice.totalAmount.toFixed(2)} for ${generatedInvoice.totalHours.toFixed(2)} hours`
    });
    
    setShowGenerateDialog(false);
    setSelectedCaseForInvoice("");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">Manage billing and payments</p>
        </div>
        <div className="flex gap-2">
          <InvoiceBuilder />
          <Button variant="outline" className="gap-2" onClick={() => setShowGenerateDialog(true)}>
            <FileText className="h-4 w-4" />
            Generate Invoice
          </Button>
          <Button variant="gradient" className="gap-2" onClick={handleCreateInvoice}>
            <Plus className="h-4 w-4" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Billed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.total.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">${stats.paid.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">${stats.outstanding.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">${stats.overdue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Invoices</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Case</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.map((invoice) => (
              <TableRow key={invoice.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-medium" onClick={() => handleViewInvoice(invoice)}>
                  {invoice.invoiceNumber}
                </TableCell>
                <TableCell onClick={() => handleViewInvoice(invoice)}>{invoice.clientName}</TableCell>
                <TableCell onClick={() => handleViewInvoice(invoice)}>{invoice.caseNumber}</TableCell>
                <TableCell onClick={() => handleViewInvoice(invoice)}>{invoice.issueDate}</TableCell>
                <TableCell onClick={() => handleViewInvoice(invoice)}>{invoice.dueDate}</TableCell>
                <TableCell onClick={() => handleViewInvoice(invoice)}>
                  ${invoice.total.toLocaleString()}
                </TableCell>
                <TableCell onClick={() => handleViewInvoice(invoice)}>
                  ${invoice.balance.toLocaleString()}
                </TableCell>
                <TableCell onClick={() => handleViewInvoice(invoice)}>
                  {getStatusBadge(invoice.status)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewInvoice(invoice)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditInvoice(invoice)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleSendInvoice(invoice)}>
                        <Send className="h-4 w-4 mr-2" />
                        Send to Client
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {invoice.status !== 'paid' && (
                        <DropdownMenuItem onClick={() => handleMarkAsPaid(invoice)}>
                          Mark as Paid
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <InvoiceDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        invoice={editingInvoice}
        onSave={handleSaveInvoice}
      />

      <InvoiceDetails
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        invoice={selectedInvoice}
      />

      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Invoice from Time Entries</DialogTitle>
            <DialogDescription>
              Select a case to generate an invoice from unbilled time entries
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Case</label>
              <Select value={selectedCaseForInvoice} onValueChange={setSelectedCaseForInvoice}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a case..." />
                </SelectTrigger>
                <SelectContent>
                  {[].filter(c => c.status === 'active').map(caseItem => (
                    <SelectItem key={caseItem.id} value={caseItem.id}>
                      {caseItem.caseNumber} - {caseItem.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerateInvoice}>
              Generate & Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Invoices;