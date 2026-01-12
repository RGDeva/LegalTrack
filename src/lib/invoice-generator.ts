import { TimeEntry, BillingCode, Case, User } from "@/types";
import { calculateEffectiveRate } from "./time-utils";

export interface InvoiceLineItem {
  date: string;
  description: string;
  billingCode: string;
  hours: number;
  rate: number;
  amount: number;
}

export interface GeneratedInvoice {
  caseId: string;
  caseNumber: string;
  clientName: string;
  lineItems: InvoiceLineItem[];
  totalHours: number;
  totalAmount: number;
  generatedAt: string;
}

/**
 * Generate an invoice from unbilled time entries for a specific case
 */
export function generateInvoiceFromTimeEntries(
  caseId: string
): GeneratedInvoice | null {
  // Get all time entries from localStorage
  const timeEntriesJson = localStorage.getItem('timeEntries') || '[]';
  const allTimeEntries: TimeEntry[] = JSON.parse(timeEntriesJson);
  
  // Filter unbilled entries for this case
  const unbilledEntries = allTimeEntries.filter(
    entry => entry.caseId === caseId && !entry.billingCodeId?.includes('_billed')
  );
  
  if (unbilledEntries.length === 0) {
    return null;
  }
  
  // Get case info
  const caseData = [].find(c => c.id === caseId);
  if (!caseData) {
    return null;
  }
  
  // Group entries by billing code and description
  const lineItems: InvoiceLineItem[] = [];
  let totalHours = 0;
  let totalAmount = 0;
  
  unbilledEntries.forEach(entry => {
    const user = [].find(u => u.id === entry.userId);
    const billingCode = entry.billingCodeId 
      ? [].find(bc => bc.id === entry.billingCodeId)
      : null;
    
    const hours = entry.billableMinutes / 60;
    const rate = billingCode && user 
      ? calculateEffectiveRate(user, billingCode) / 100 // Convert cents to dollars
      : 0;
    const amount = hours * rate;
    
    lineItems.push({
      date: new Date(entry.createdAt).toLocaleDateString(),
      description: entry.description,
      billingCode: billingCode?.code || 'N/A',
      hours,
      rate,
      amount
    });
    
    totalHours += hours;
    totalAmount += amount;
  });
  
  return {
    caseId,
    caseNumber: caseData.caseNumber,
    clientName: caseData.clientName,
    lineItems,
    totalHours,
    totalAmount,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Mark time entries as billed
 */
export function markTimeEntriesAsBilled(caseId: string): void {
  const timeEntriesJson = localStorage.getItem('timeEntries') || '[]';
  const allTimeEntries: TimeEntry[] = JSON.parse(timeEntriesJson);
  
  const updatedEntries = allTimeEntries.map(entry => {
    if (entry.caseId === caseId && !entry.billingCodeId?.includes('_billed')) {
      return {
        ...entry,
        billingCodeId: entry.billingCodeId + '_billed'
      };
    }
    return entry;
  });
  
  localStorage.setItem('timeEntries', JSON.stringify(updatedEntries));
}

/**
 * Generate a simple text invoice (in real app, this would generate a PDF using the DOCX template)
 */
export function generateInvoiceText(invoice: GeneratedInvoice): string {
  const lines = [
    '═══════════════════════════════════════════════',
    '                  INVOICE',
    '═══════════════════════════════════════════════',
    '',
    `Case: ${invoice.caseNumber}`,
    `Client: ${invoice.clientName}`,
    `Date: ${new Date(invoice.generatedAt).toLocaleDateString()}`,
    '',
    '───────────────────────────────────────────────',
    'BILLABLE TIME',
    '───────────────────────────────────────────────',
    ''
  ];
  
  invoice.lineItems.forEach(item => {
    lines.push(`Date: ${item.date}`);
    lines.push(`Code: ${item.billingCode} - ${item.description}`);
    lines.push(`Hours: ${item.hours.toFixed(2)} @ $${item.rate.toFixed(2)}/hr = $${item.amount.toFixed(2)}`);
    lines.push('');
  });
  
  lines.push('───────────────────────────────────────────────');
  lines.push(`Total Hours: ${invoice.totalHours.toFixed(2)}`);
  lines.push(`Total Amount: $${invoice.totalAmount.toFixed(2)}`);
  lines.push('═══════════════════════════════════════════════');
  
  return lines.join('\n');
}

/**
 * Download invoice as text file (placeholder for PDF generation)
 */
export function downloadInvoice(invoice: GeneratedInvoice): void {
  const text = generateInvoiceText(invoice);
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Invoice_${invoice.caseNumber}_${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
