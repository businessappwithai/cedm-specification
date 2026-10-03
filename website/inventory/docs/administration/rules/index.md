---
title: "Business rules"
sidebar_position: 1
description: "Every business rule, in plain words."
---

# Business rules

A business rule runs when a record is saved. It can refuse the save with a message, fill in a field, create or update another record, or start a process. Rules are edited in **Business Rules** (`/admin/rules`); each page below explains the rules of one window with the screen where the rule is edited.

![The Business Rules window](/img/admin/rules.jpg)

**How to read a rule.** *When* is the condition over the record's fields, written with the labels you see on screen. *Then* is what the rule does. A rule with no condition runs on every save. Rules run in the order shown; a rule that refuses the save stops the save and nothing it would have changed is kept.

| Window | Rules |
| --- | --- |
| [Party Role](/administration/rules/party-role/) | 2 |
| [Address](/administration/rules/address/) | 2 |
| [Exchange Rate](/administration/rules/exchange-rate/) | 3 |
| [Task](/administration/rules/task/) | 2 |
| [Inventory Transfer](/administration/rules/inventory-transfer/) | 3 |
| [Inventory Count](/administration/rules/inventory-count/) | 2 |
| [Product](/administration/rules/product/) | 3 |
| [Warehouse](/administration/rules/inventory-location/) | 3 |
| [Warehouse](/administration/rules/warehouse/) | 2 |
| [Putaway](/administration/rules/putaway/) | 3 |
| [Picking](/administration/rules/picking/) | 3 |
| [Packing](/administration/rules/packing/) | 3 |
| [Party](/administration/rules/party/) | 1 |
| [Inventory Reservation](/administration/rules/inventory-reservation/) | 1 |
| [Lot](/administration/rules/lot/) | 1 |
| [Serial Number](/administration/rules/serial-number/) | 1 |
| [Wave](/administration/rules/wave/) | 1 |
