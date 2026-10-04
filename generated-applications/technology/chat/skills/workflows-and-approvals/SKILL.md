---
name: workflows-and-approvals
description: Moving a record through its workflow with request_approval.
whenToUse: When the person wants to approve, reject, submit, close, cancel or otherwise move a record's status.
---

# Workflows and approvals

A record with a workflow has a status that moves only along the steps the
business drew. `get_record_summary` lists the moves available **from the
current status**; any other move does not exist.

To move a record, call `request_approval` with the record's ref and the target
status from that list. It opens the record at its workflow bar with that move
selected; the person confirms it in the application.

- The application decides whether *this person* may make that move. If their
  role may not, the confirmation is refused and the screen says so — that is a
  permission, not an error.
- Two people moving the same record at once: one move lands, the other is
  refused as a conflict.
- A final status has no moves. The record's transaction is complete.
- After the move, the `[Application]` message reports the new status; state it.
