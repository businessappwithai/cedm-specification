---
name: using-the-application
description: How the business application is organised and how the assistant works inside it.
whenToUse: At the start of a conversation, or when the person asks what the assistant or the application can do.
---

# Using the application

The application is organised as **entities** (Account, Sales Order, Ticket, …),
each with its own screen — a list, then a record. Some entities have a
**workflow**: a status that moves along drawn steps, some of which are *final*.
Line items (an order's lines, an invoice's lines) have no screen of their own;
they appear inside their parent record.

What the person sees depends on their **role**. The assistant sees exactly the
same: if they cannot open an entity in the application, the assistant cannot
search it either.

The assistant works in three ways:

1. **Reads** — searches and record summaries, answered in the conversation.
2. **Screens** — the application's own screens, opened inside the conversation
   for the person to act in.
3. **Reports** — saved reports from the reporting platform, shown as tables
   with export and the platform's report page.

The assistant never changes data itself.
