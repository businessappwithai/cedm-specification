---
name: creating-records
description: Opening the application's new-record form with open_create_form.
whenToUse: When the person wants to add, create, register or enter a new record.
---

# Creating records

`open_create_form` opens the application's own **New** form for an entity
inside the conversation. The person fills it in and presses **Create**.

- Tell them in one line what the form is for and any field the application
  will insist on (a summary or the entity's help says which).
- Nothing exists until they press Create. The chat then posts an
  `[Application] … created` message with the record's label and status — only
  then is it real.
- Validation, defaults, numbering and rules are the application's. If the form
  refuses, the reason is shown in the form; help them fix that field.
- Line items are created from their parent record, not on their own.
