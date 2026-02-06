export interface Case {
  id: string;
  caseNumber: string;
  title: string;
  clientId: string;
  clientName: string;
  status: 'active' | 'pending' | 'closed' | 'on-hold';
  type: string;
  dateOpened: string;
  dateClosed?: string;
  nextHearing?: string;
  billingType: 'hourly' | 'flat-fee';
  hourlyRate?: number;
  flatFee?: number;
  totalBilled: number;
  totalPaid: number;
  description: string;
  assignedTo: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  company?: string;
  dateAdded: string;
  activeCases: number;
  totalCases: number;
  notes?: string;
}

export interface LegacyTimeEntry {
  id: string;
  caseId: string;
  caseNumber: string;
  clientName: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number; // in 6-minute increments
  description: string;
  billable: boolean;
  billed: boolean;
  rate: number;
  amount: number;
  attorney: string;
  billingCode?: string;
}

export interface Contact {
  id: string;
  name: string;
  title?: string;
  organization?: string;
  email: string;
  phone: string;
  mobile?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  role?: string;
  category?: 'client' | 'opposing-counsel' | 'court' | 'expert' | 'vendor' | 'other';
  notes?: string;
  lastContact?: string;
  tags?: string[];
}

export interface Document {
  id: string;
  caseId: string;
  caseNumber: string;
  name: string;
  type: string;
  uploadDate: string;
  uploadedBy: string;
  size: string;
  category: 'pleading' | 'discovery' | 'correspondence' | 'evidence' | 'contract' | 'other';
  tags: string[];
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  caseId: string;
  caseNumber: string;
  clientId: string;
  clientName: string;
  issueDate: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'partial';
  billingType: 'hourly' | 'flat-fee';
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  amountPaid: number;
  balance: number;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'hearing' | 'meeting' | 'deadline' | 'appointment' | 'other';
  caseId?: string;
  caseNumber?: string;
  location?: string;
  description?: string;
  reminder?: boolean;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  status: 'active' | 'inactive' | 'on-leave';
  joinDate: string;
  barNumber?: string;
  billableRate: number;
  avatar?: string;
}

export interface Lead {
  id: string;
  contactId: string;
  contact: Contact;
  crmStage: 'open' | 'contacted' | 'negotiation' | 'closed';
  source: 'website' | 'referral' | 'cold-call' | 'event' | 'social-media' | 'other';
  value?: number;
  probability?: number; // 0-100
  expectedCloseDate?: string;
  notes?: string;
  createdDate: string;
  lastActivityDate?: string;
}

// New types for time/billing system
export interface TimeEntry {
  id: string;
  caseId: string;
  userId: string;
  startedAt: string;
  stoppedAt: string;
  rawSeconds: number;
  billableMinutes: number;
  description: string;
  billingCodeId?: string;
  createdAt: string;
}

export interface BillingCode {
  id: string;
  code: string;
  label: string;
  roleRatePolicy: Record<string, number>; // role -> rate in cents/hour
  active: boolean;
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface RunsheetEntryTag {
  id: string;
  runsheetEntryId: string;
  tagId: string;
}

export interface RunsheetEntry {
  id: string;
  caseId: string;
  userId: string;
  text: string;
  createdAt: string;
  tags?: Tag[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Attorney' | 'Staff' | 'Paralegal' | 'Legal Assistant' | 'Developer';
  firmId: string;
  phone?: string;
  department?: string;
  barNumber?: string;
  billableRate?: number;
  status?: 'active' | 'inactive';
  joinDate?: string;
  avatar?: string;
}

export interface Deadline {
  id: string;
  caseId: string;
  title: string;
  dueDate: string;
  assignee: string;
  status: 'pending' | 'completed' | 'overdue';
  createdAt: string;
  reminderSent24h?: boolean;
  reminderSent2h?: boolean;
}