#!/bin/bash
# Remove all mock-data imports and replace with empty arrays

files=(
  "src/components/admin/BillingCodes.tsx"
  "src/components/auth/LoginDialog.tsx"
  "src/components/cases/ContactSelector.tsx"
  "src/components/cases/Runsheet.tsx"
  "src/components/cases/Team.tsx"
  "src/components/cases/Timesheet.tsx"
  "src/components/contacts/AddContactDialog.tsx"
  "src/components/dashboard/CalendarView.tsx"
  "src/components/invoices/InvoiceDialog.tsx"
  "src/components/staff/AddStaffDialog.tsx"
  "src/components/time/TimeTracker.tsx"
  "src/components/timer/TimerWidget.tsx"
  "src/contexts/AuthContext.tsx"
  "src/lib/invoice-generator.ts"
  "src/pages/CaseDetail.tsx"
  "src/pages/Clients.tsx"
  "src/pages/Dashboard.tsx"
  "src/pages/Invoices.tsx"
  "src/pages/Time.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    # Remove import line
    sed -i '' '/from.*mock-data/d' "$file"
    # Replace mock variable usage with empty arrays
    sed -i '' 's/mockCases/[]/g' "$file"
    sed -i '' 's/mockContacts/[]/g' "$file"
    sed -i '' 's/mockUsers/[]/g' "$file"
    sed -i '' 's/mockStaff/[]/g' "$file"
    sed -i '' 's/mockTimeEntries/[]/g' "$file"
    sed -i '' 's/mockInvoices/[]/g' "$file"
    sed -i '' 's/mockBillingCodes/[]/g' "$file"
    sed -i '' 's/mockLeads/[]/g' "$file"
    sed -i '' 's/mockTags/[]/g' "$file"
    sed -i '' 's/mockCalendarEvents/[]/g' "$file"
    sed -i '' 's/mockClients/[]/g' "$file"
    sed -i '' 's/sampleTimeEntries/[]/g' "$file"
    echo "Fixed: $file"
  fi
done

echo "All mock-data references removed!"
