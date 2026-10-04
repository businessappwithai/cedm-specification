---
name: asking-questions-in-plain-language
description: Turning a question in plain language into the right report or search.
whenToUse: When the person asks a business question in their own words and it is not obvious which tool answers it.
---

# Asking questions in plain language

Map the question to the narrowest tool that answers it truthfully:

| The question is about | Use |
|---|---|
| one named record ("what's the status of Acme's order?") | `search_records`, then `get_record_summary` |
| a short list ("open tickets assigned to me") | `search_records` with filters |
| a number across records ("how many", "total", "by month") | `search_reports`, then `run_approved_report` |
| doing something ("approve", "add", "change") | open the screen; see the other skills |

There is no free-form query. Questions are answered by the saved reports the
business has agreed on; when none fits, say what reports exist that come
closest, and that a new report would need to be created on the reporting
platform.
