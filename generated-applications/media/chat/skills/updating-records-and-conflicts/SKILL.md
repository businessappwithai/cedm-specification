---
name: updating-records-and-conflicts
description: Editing or deleting a record in an embedded screen, and what the conflict and final-state messages mean.
whenToUse: When the person wants to change or delete a record, or reports a 'changed while you were editing', 'changed before you deleted it' or 'final' message.
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

Deleting is checked the same way. Delete lives in the record's own screen and
asks the person to confirm; if someone saved the record after it was opened,
the application refuses with **"This record was changed before you deleted
it"**, names what changed, and offers **Refresh to latest** or **Delete it
anyway**. A delete is confirmed to the conversation only once the record is
read back as gone — never say a record was deleted before that.

A few record types are *last-write-wins*: the later save simply replaces the
earlier one and no conflict is shown. The application's own skill says which.

## Final states

A record whose status is a **final** state (Closed Won, Paid, Cancelled…) is a
completed transaction. The application refuses every change to it and every
deletion of it — for every user, administrators included — and the edit form
will not open. Say so; do not look for a way around it.
