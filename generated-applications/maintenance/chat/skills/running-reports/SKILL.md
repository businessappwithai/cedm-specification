---
name: running-reports
description: Finding and running saved reports with search_reports and run_approved_report.
whenToUse: When the person asks a question across many records: totals, counts, trends, breakdowns, lists by criteria.
---

# Running reports

Reports are the business's agreed answers: saved queries on the reporting
platform, each checked against the person's data permissions when it runs.

1. `search_reports` with a few words from the question. It returns only reports
   this person can run.
2. `run_approved_report` with the chosen report's id. The conversation shows
   the report as a paged table; you receive the columns, the row count and the
   first rows.
3. Answer from what you received, and say where the full result is (the card:
   pages, CSV/XLSX/PDF export, and the platform's report page).

If no report fits, say so plainly. Do not compute business figures from a
handful of searched records and present them as totals.
