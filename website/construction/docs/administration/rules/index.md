---
title: "Business rules"
sidebar_position: 1
description: "Every business rule, in plain words."
---

# Business rules

A business rule runs when a record is saved. It can refuse the save with a message, fill in a field, create or update another record, or start a process. Rules are edited in **Business Rules** (`/admin/rules`); each page below explains the rules of one window with the screen where the rule is edited.


**How to read a rule.** *When* is the condition over the record's fields, written with the labels you see on screen. *Then* is what the rule does. A rule with no condition runs on every save. Rules run in the order shown; a rule that refuses the save stops the save and nothing it would have changed is kept.

| Window | Rules |
| --- | --- |
| [Party Role](/administration/rules/party-role/) | 2 |
| [Address](/administration/rules/address/) | 2 |
| [Exchange Rate](/administration/rules/exchange-rate/) | 3 |
| [Task](/administration/rules/task/) | 2 |
| [Project](/administration/rules/project/) | 3 |
| [Party](/administration/rules/party/) | 1 |
| [Construction Project](/administration/rules/construction-project/) | 1 |
