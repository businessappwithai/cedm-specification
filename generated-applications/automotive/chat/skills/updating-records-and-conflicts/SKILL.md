---
name: updating-records-and-conflicts
description: Editing a record with open_update_form, and what the conflict and final-state messages mean.
whenToUse: When the person wants to change a record, or reports a 'changed while you were editing' or 'final' message.
---

# Updating records, and conflicts

`open_update_form` opens the record's edit form. The person changes it and
saves.

## Two people, one record

Every save says which version of the record it started from. If someone else
saved in between, the application refuses with **"This record was changed
while you were editing it"** and shows who changed it, when, and the fields
that differ — theirs beside the person's. Two choices:

- **Refresh to latest** — discard the person's edits and load the record as it
  now stands. Safe; nothing they typed is kept.
- **Overwrite with my changes** — save the person's values over the other
  edit. Deliberate; the other person's changes to those fields are lost.

It is the person's call. Explain the difference; do not choose for them.

## Final states

A record whose status is a **final** state (Closed Won, Paid, Cancelled…) is a
completed transaction. The application refuses every change to it — for every
user, administrators included — and the edit form will not open. Say so; do not
look for a way around it.
