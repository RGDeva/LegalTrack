import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, Send, Printer, FileText } from "lucide-react";
import { Invoice } from "@/types";
import { toast } from "sonner";
import { API_URL } from '@/lib/api-url';

interface InvoiceDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
}

export const InvoiceDetails = ({ open, onOpenChange, invoice }: InvoiceDetailsProps) => {
  if (!invoice) return null;

  const handleGenerateDocx = async () => {
    try {
      toast.info('Generating invoice DOCX...');
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/invoices/${invoice.id}/generate-docx`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Invoice_${invoice.invoiceNumber}.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Invoice DOCX downloaded successfully');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to generate DOCX');
      }
    } catch (error) {
      console.error('Error generating DOCX:', error);
      toast.error('Failed to generate invoice DOCX');
    }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-2xl">Invoice {invoice.invoiceNumber}</DialogTitle>
              <div className="mt-2">{getStatusBadge(invoice.status)}</div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleGenerateDocx}>
                <FileText className="h-4 w-4 mr-1" />
                Generate DOCX
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                PDF
              </Button>
              <Button variant="outline" size="sm">
                <Send className="h-4 w-4 mr-1" />
                Send
              </Button>
              <Button variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">Bill To</h3>
              <div>
                <p className="font-semibold">{invoice.clientName}</p>
                <p className="text-sm text-muted-foreground">Case: {invoice.caseNumber}</p>
              </div>
            </div>
            <div className="text-right">
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">Invoice Details</h3>
              <div className="text-sm space-y-1">
                <p><span className="text-muted-foreground">Issue Date:</span> {invoice.issueDate}</p>
                <p><span className="text-muted-foreground">Due Date:</span> {invoice.dueDate}</p>
                <p><span className="text-muted-foreground">Billing Type:</span> {invoice.billingType}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Line Items */}
          <div>
            <h3 className="font-semibold mb-3">Items</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">Description</th>
                    <th className="text-right p-3 text-sm font-medium">Qty</th>
                    <th className="text-right p-3 text-sm font-medium">Rate</th>
                    <th className="text-right p-3 text-sm font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-3">{item.description}</td>
                      <td className="p-3 text-right">{item.quantity}</td>
                      <td className="p-3 text-right">${item.rate.toFixed(2)}</td>
                      <td className="p-3 text-right font-medium">${item.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>${invoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax:</span>
                <span>${invoice.tax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>${invoice.total.toFixed(2)}</span>
              </div>
              {invoice.amountPaid > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount Paid:</span>
                    <span className="text-success">${invoice.amountPaid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Balance Due:</span>
                    <span className={invoice.balance > 0 ? "text-destructive" : "text-success"}>
                      ${invoice.balance.toFixed(2)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
