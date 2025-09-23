# Path Convention for Storage Manager API

## Recommended Path Structure

The API uses a hierarchical path structure to organize files efficiently. Here are the recommended conventions:

### Base Pattern
```
{department}/{category}/{year}/{month}/{subcategory}/{filename}
```

### Examples by Use Case

#### 1. **Human Resources**
```
hr/employees/{year}/{month}/{employee_id}/{document_type}_{filename}
hr/contracts/{year}/{month}/{contract_id}_{filename}
hr/policies/{year}/{policy_name}_{version}.pdf
hr/training/{year}/{course_id}/{attendee_id}_{certificate}.pdf
```

#### 2. **Finance**
```
finance/invoices/{year}/{month}/{invoice_number}_{vendor}.pdf
finance/reports/{year}/Q{quarter}/{report_type}_{date}.xlsx
finance/receipts/{year}/{month}/{day}/{receipt_id}_{amount}.jpg
finance/budgets/{year}/{department}_{budget_type}.xlsx
```

#### 3. **Operations/Maintenance**
```
operations/maintenance/{year}/{month}/{equipment_id}/{work_order}_{date}.pdf
operations/inspections/{year}/{month}/{location}/{inspection_id}.pdf
operations/manuals/{equipment_type}/{model}/{manual_type}_{version}.pdf
operations/incidents/{year}/{month}/{day}/{incident_id}_{severity}.pdf
```

#### 4. **Marketing**
```
marketing/campaigns/{year}/{campaign_id}/{asset_type}/{filename}
marketing/assets/images/{year}/{month}/{project}/{filename}
marketing/presentations/{year}/{month}/{event_name}/{presenter}_{title}.pptx
marketing/branding/{brand_element}/{version}/{filename}
```

#### 5. **IT/Technical**
```
it/backups/{year}/{month}/{day}/{system}_{backup_type}.zip
it/logs/{year}/{month}/{day}/{service}/{log_type}_{timestamp}.log
it/documentation/{system}/{version}/{doc_type}_{title}.md
it/licenses/{software}/{vendor}/{license_key}_{expiry_date}.pdf
```

#### 6. **Legal**
```
legal/contracts/{year}/{contract_type}/{party_name}/{contract_id}.pdf
legal/compliance/{year}/{regulation}/{audit_date}_{report}.pdf
legal/policies/{policy_type}/{version}/{effective_date}_{policy_name}.pdf
legal/cases/{year}/{case_id}/{document_type}_{date}.pdf
```

#### 7. **Projects**
```
projects/{project_id}/{phase}/{deliverable_type}/{filename}
projects/{project_id}/documents/{year}/{month}/{doc_type}_{version}.pdf
projects/{project_id}/reports/{year}/W{week}/{report_name}.pdf
projects/{project_id}/resources/{resource_type}/{filename}
```

## Best Practices

### File Naming Conventions

1. **Use lowercase**: Keep all paths in lowercase for consistency
   - ✅ `hr/employees/2024/01/emp001/contract.pdf`
   - ❌ `HR/Employees/2024/01/EMP001/Contract.PDF`

2. **Use hyphens or underscores**: Replace spaces with hyphens (-) or underscores (_)
   - ✅ `annual-report-2024.pdf` or `annual_report_2024.pdf`
   - ❌ `annual report 2024.pdf`

3. **Include dates**: Use ISO 8601 format (YYYY-MM-DD) for dates
   - ✅ `backup_2024-03-15.zip`
   - ❌ `backup_15-03-24.zip`

4. **Add version numbers**: Include version in filename when applicable
   - ✅ `policy_v2.1_2024-03-15.pdf`
   - ❌ `policy_final_final_v2.pdf`

5. **Use meaningful prefixes**: Add context through prefixes
   - ✅ `inv_00123_microsoft.pdf` (invoice)
   - ✅ `po_00456_supplies.pdf` (purchase order)
   - ✅ `rpt_quarterly_q1_2024.xlsx` (report)

### Container Organization

Recommended containers by department:

```json
{
  "containers": {
    "hr": "Human Resources files",
    "finance": "Financial documents",
    "operations": "Operations and maintenance",
    "marketing": "Marketing materials",
    "it": "IT and technical documents",
    "legal": "Legal documents",
    "projects": "Project files",
    "shared": "Company-wide shared files",
    "temp": "Temporary files (auto-cleanup after 30 days)",
    "archive": "Archived/historical files"
  }
}
```

## Metadata Standards

Always include relevant metadata when uploading files:

```json
{
  "author": "john.doe@company.com",
  "department": "finance",
  "documentType": "invoice",
  "tags": "vendor,microsoft,software",
  "retentionDays": "2555",  // 7 years for financial documents
  "confidentiality": "internal",  // public, internal, confidential, restricted
  "version": "1.0",
  "relatedId": "PO-2024-00456"  // Related document ID
}
```

## Path Length Limitations

- **Maximum path length**: 1024 characters
- **Maximum filename length**: 255 characters
- **Maximum directory depth**: 10 levels

## Special Considerations

### Compliance and Retention
```
archive/{year}/compliance/{regulation}/{audit_id}/{filename}
archive/{year}/retained/{retention_years}/{department}/{filename}
```

### Temporary Files
```
temp/{session_id}/{timestamp}_{filename}
temp/processing/{job_id}/{filename}
```

### Shared Resources
```
shared/templates/{category}/{template_name}_{version}.docx
shared/forms/{department}/{form_id}_{language}.pdf
shared/resources/{resource_type}/{filename}
```

## API Usage Examples

### Upload with structured path:
```bash
curl -X POST http://localhost:7071/api/files/upload \
  -H "x-api-key: your-api-key" \
  -F "file=@document.pdf" \
  -F "container=finance" \
  -F "path=invoices/2024/03/inv_00123_vendor.pdf" \
  -F 'metadata={"author":"john.doe","documentType":"invoice","retentionDays":"2555"}'
```

### List files in a specific path:
```bash
curl -X GET "http://localhost:7071/api/files/list?container=finance&prefix=invoices/2024/03/" \
  -H "x-api-key: your-api-key"
```

## Benefits of This Structure

1. **Scalability**: Hierarchical structure prevents directory overload
2. **Searchability**: Logical paths make files easy to locate
3. **Compliance**: Clear retention and archival paths
4. **Automation**: Predictable patterns enable automated processing
5. **Access Control**: Path-based permissions can be implemented
6. **Audit Trail**: Clear organization aids in compliance audits

## Migration Strategy

For existing unstructured files:

1. **Analyze**: Audit current file structure
2. **Map**: Create mapping from old to new paths
3. **Migrate**: Use the copy endpoint to reorganize files
4. **Verify**: Ensure all files are accessible in new locations
5. **Archive**: Move old structure to archive container
6. **Update**: Update all references to use new paths

## Monitoring and Maintenance

- Regular cleanup of `/temp/` paths
- Archive files older than retention period
- Monitor path usage patterns
- Validate compliance with naming conventions
- Generate monthly storage reports by path