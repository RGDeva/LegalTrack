# Praxis Plus - Time Tracking & Billing Features

## Overview
This document describes the time tracking and billing features added to the Praxis Plus legal case management system.

## Features Implemented

### 1. Run Timer + /log Parser

#### Timer Component
- **Location**: Case Detail page header
- **Features**:
  - Start/Pause/Stop buttons
  - Real-time elapsed time display (hh:mm format)
  - Description field (required before starting)
  - Billing code dropdown (optional)
  - Rate preview (visible to Admin/Attorney only)
  - Auto-creates time entry on Stop
  - Saves to localStorage (simulates database)

#### /log Command Parser
- **Usage**: In Runsheet activity log
- **Format**: `/log 11m drafted discovery letter`
- **Features**:
  - Parses duration in minutes
  - Automatically rounds to 6-minute increments
  - Creates both:
    - Runsheet entry with description
    - Time entry with billable minutes
  - Live preview while typing
  - Example: `/log 11m call with client` → creates 12-minute billable entry

### 2. Billing Codes Integration

#### Default Codes (001-007)
| Code | Description |
|------|-------------|
| 001 | Managing case file |
| 002 | Writing and emails, letters, and other communications |
| 003 | Court events |
| 004 | Drafting or reviewing documents |
| 005 | Legal research |
| 006 | Meeting or call with others |
| 007 | Travel time |

#### Rate Structure
- **Admin**: $300-450/hour (depending on code)
- **Attorney**: $250-400/hour (depending on code)
- **Staff**: $50-100/hour (depending on code)

#### Management Interface
- **Location**: Settings → Billing Codes
- **Access**: Admin only
- **Features**:
  - CRUD operations for billing codes
  - Set different rates per role
  - Active/Inactive status
  - Code and label customization

### 3. Automatic Invoice Generation

#### Generate Invoice Feature
- **Location**: Invoices page → "Generate Invoice" button
- **Process**:
  1. Select a case from dropdown
  2. System gathers all unbilled time entries
  3. Aggregates by billing code and description
  4. Calculates total hours and amount
  5. Generates text invoice (placeholder for PDF)
  6. Downloads invoice file
  7. Marks time entries as billed

#### Invoice Format
```
═══════════════════════════════════════════════
                  INVOICE
═══════════════════════════════════════════════

Case: 2024-CV-001
Client: Robert Johnson
Date: 02/14/2024

───────────────────────────────────────────────
BILLABLE TIME
───────────────────────────────────────────────

Date: 02/10/2024
Code: 006 - Initial client meeting to discuss case strategy
Hours: 1.50 @ $350.00/hr = $525.00

Date: 02/11/2024
Code: 004 - Drafted discovery motion and supporting documents
Hours: 1.80 @ $350.00/hr = $630.00

───────────────────────────────────────────────
Total Hours: 3.30
Total Amount: $1,155.00
═══════════════════════════════════════════════
```

### 4. Role-Based Access Control

#### User Roles
- **Admin**: Full access to all features
- **Attorney**: Can view rates and billing settings
- **Staff**: Cannot view rates or access billing settings

#### Access Restrictions
| Feature | Admin | Attorney | Staff |
|---------|-------|----------|-------|
| View Rates | ✓ | ✓ | ✗ |
| Billing Codes Management | ✓ | ✗ | ✗ |
| Generate Invoices | ✓ | ✓ | ✓ |
| Timer | ✓ | ✓ | ✓ |
| /log Command | ✓ | ✓ | ✓ |

### 5. Dashboard Enhancements

#### New Metrics Cards
1. **Billable Hours (Month)**: Sum of billable minutes for current month
2. **Ready to Invoice**: Total dollar amount of unbilled time entries
3. **Active Timers** (Admin only): Count of time entries in last 24 hours

#### Role-Based Display
- Admin sees: Active Cases, Billable Hours, Ready to Invoice, Active Timers
- Attorney/Staff see: Active Cases, Billable Hours, Ready to Invoice, Pending Invoices

### 6. Data Seeding

#### Sample Data Included
- **Users**: 4 users (1 Admin, 2 Attorneys, 1 Staff)
- **Billing Codes**: 7 default codes (001-007)
- **Time Entries**: 4 sample entries across 2 cases
- **Tags**: 5 predefined tags for runsheet entries

#### Auto-Seeding
- Sample time entries automatically seeded on first app load
- Stored in localStorage for persistence
- Can be cleared by clearing browser storage

## Technical Implementation

### Data Storage
- **Time Entries**: localStorage key `timeEntries`
- **Current User**: localStorage key `currentUser`
- **Format**: JSON arrays/objects

### Time Calculation
- **Raw Time**: Stored in seconds
- **Billable Time**: Rounded up to nearest 6-minute increment
- **Formula**: `Math.ceil(minutes / 6) * 6`

### Rate Calculation
- Rates stored in cents (e.g., 35000 = $350.00)
- Role-based rate lookup from billing code policy
- Amount = (billable minutes / 60) × rate

### Invoice Generation
- Filters unbilled entries by case
- Groups by billing code
- Calculates totals
- Marks entries as billed (appends `_billed` to billingCodeId)

## Usage Guide

### For Attorneys

1. **Track Time**:
   - Navigate to a case
   - Enter description in timer
   - Select billing code
   - Click Start
   - Click Stop when done

2. **Quick Log**:
   - Go to Runsheet tab
   - Click "Log Activity"
   - Type: `/log 15m reviewed contract`
   - Submit

3. **Generate Invoice**:
   - Go to Invoices page
   - Click "Generate Invoice"
   - Select case
   - Click "Generate & Download"

### For Admins

1. **Manage Billing Codes**:
   - Go to Settings
   - View/Edit/Add billing codes
   - Set rates per role

2. **Monitor Activity**:
   - Check Dashboard for Active Timers
   - Review Ready to Invoice amount
   - Track monthly billable hours

### For Staff

1. **Track Time**:
   - Same as attorneys
   - Cannot view hourly rates
   - Cannot access billing settings

## Future Enhancements

The following features are noted for future development:
- PDF generation using DOCX template
- QuickBooks integration
- Calendar integration
- AI-powered time entry suggestions
- Batch invoice generation
- Payment tracking
- Client portal

## Notes

- This implementation uses localStorage for data persistence
- In production, this should be replaced with a proper backend API
- The DOCX template mentioned in requirements is not yet integrated (placeholder text invoice used)
- All monetary values are in USD
- Time rounding follows standard legal billing practices (6-minute increments)
