---
name: finding-records
description: Searching for records with search_records and reading one with get_record_summary.
whenToUse: When the person asks to find, list, look up or check records.
---

# Finding records

- Name the entity as the application does. `search_records` accepts the screen
  name ("Sales Order"), the singular, or the table name; if it refuses, its
  message lists the entities this person can see.
- Use `text` for "anything mentioning…" and `filters` for exact values
  (`{"status": "open"}`). Filters take column names, which appear as field
  labels in results; ask `get_record_summary` when unsure.
- Results are paged (default 20, up to 50). Say how many matched in total, not
  just how many you show.
- Each row has a `ref`. Keep it to open or summarise that record later; never
  show it to the person.
- For totals, counts by status or anything across many records, use a report
  instead (see *running-reports*).
