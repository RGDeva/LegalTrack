# Invoice Template Instructions

## Required File
Place the EC Invoice Template DOCX file here:
`backend/templates/EC Invoice Template 07.03.25.docx`

## Template Tags
The DOCX template should contain these merge fields:

### Client Information
- {client.name}
- {clientAddress1Line1}
- {clientAddress1Line2}
- {clientAddress1City}
- {clientAddress1State}
- {clientAddress1Zip}

### Invoice Details
- {invoiceNumber}
- {invoiceDate}
- {invoiceTermsDays}
- {invoiceDueDate}
- {invoiceTotalBalance}
- {invoiceStartDate}
- {invoiceEndDate}

### Time Entries (Array: ProjectTime)
Each entry in the ProjectTime array should have:
- {billingitemdate}
- {billingitemdescription}
- {billingitemuserFullName}
- {billingitemrate}
- {billingitemquantity}
- {billingItemTotal}

## Usage
The endpoint will:
1. Load invoice from database
2. Get associated time entries (with stored 6-min rounded values)
3. Populate template with data
4. Return downloadable DOCX file

**Note**: The template file needs to be placed in this directory manually.
