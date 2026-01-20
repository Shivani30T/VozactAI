# Excel/CSV Upload Template Guide

## Required Format

Your Excel or CSV file must follow this format to successfully upload contacts to the Call Manager system.

## Template Structure

### Required Columns:
1. **Name** - Full name of the contact
2. **Phone Number** - Phone number with country code

### Optional Columns:
3. **Email** - Email address
4. **Address** - Full address

## Example Format

### CSV Format (contacts_template.csv):
```csv
Name,Phone Number,Email,Address
John Doe,+1-555-0101,john@example.com,"123 Main St, City, State"
Jane Smith,+1-555-0102,jane@example.com,"456 Oak Ave, City, State"
Bob Johnson,+1-555-0103,bob@example.com,"789 Pine Rd, City, State"
```

### Excel Format (.xlsx):

| Name | Phone Number | Email | Address |
|------|-------------|-------|---------|
| John Doe | +1-555-0101 | john@example.com | 123 Main St, City, State |
| Jane Smith | +1-555-0102 | jane@example.com | 456 Oak Ave, City, State |
| Bob Johnson | +1-555-0103 | bob@example.com | 789 Pine Rd, City, State |

## Phone Number Format

✅ **Correct formats:**
- `+1-555-0101` (with country code and dashes)
- `+1 (555) 010-1234` (with spaces and parentheses)
- `+15550101234` (digits only with country code)
- `+44 20 7123 4567` (international)

❌ **Avoid:**
- `5550101` (no country code)
- `555-0101` (no country code)
- `(555) 010-1234` (no country code)

## Tips

1. **Always include country code** - Start with `+` followed by country code
2. **Keep headers exact** - Column names are case-sensitive
3. **No empty rows** - Remove any blank rows in your spreadsheet
4. **UTF-8 encoding** - Save CSV files with UTF-8 encoding for special characters
5. **Maximum rows** - Up to 10,000 contacts per upload (configurable)
6. **File size** - Maximum 10MB file size

## Download Template

You can download a sample template directly from the "Upload List" section in the application by clicking the "Download Template" button.

## Validation Rules

The system will validate:
- ✅ Required columns exist
- ✅ Phone numbers are not empty
- ✅ Names are not empty
- ✅ Email format is valid (if provided)
- ✅ No duplicate phone numbers (optional)

## Sample Data

Here are 5 sample contacts you can use for testing:

```csv
Name,Phone Number,Email,Address
Michael Brown,+1-555-0201,michael.brown@example.com,"100 Tech Blvd, San Francisco, CA"
Sarah Williams,+1-555-0202,sarah.w@example.com,"200 Innovation Dr, Austin, TX"
David Lee,+1-555-0203,david.lee@example.com,"300 Market St, Seattle, WA"
Emma Davis,+1-555-0204,emma.davis@example.com,"400 Corporate Way, New York, NY"
James Wilson,+1-555-0205,james.w@example.com,"500 Business Pkwy, Boston, MA"
```

## Troubleshooting

### Error: "File must contain columns: Name, Phone Number"
**Solution:** Make sure your first row contains exactly these column headers (case-sensitive)

### Error: "Invalid file format"
**Solution:** Only .xlsx, .xls, and .csv files are supported

### Error: "Phone number is required"
**Solution:** Ensure every row has a phone number in the "Phone Number" column

### No data imported
**Solution:** Check that:
- Your file has data in rows below the header
- There are no hidden characters in the header row
- The file is not corrupted

## Processing After Upload

Once uploaded, the system will:
1. Validate all rows
2. Check for required fields
3. Import valid contacts
4. Skip invalid rows (with error report)
5. Associate contacts with your user account
6. Make contacts available in the calling list

## Next Steps After Upload

After successfully uploading contacts:
1. Go to **Call Recordings** tab
2. Start making calls
3. Mark call status for each contact
4. View real-time statistics in **Dashboard**

---

For more help, refer to the main README.md or contact support.
