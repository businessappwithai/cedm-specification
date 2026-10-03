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
| [Quotation](/administration/rules/quotation/) | 3 |
| [Sales Order](/administration/rules/sales-order/) | 3 |
| [Sales Order](/administration/rules/sales-order-line/) | 2 |
| [Purchase Order](/administration/rules/purchase-order/) | 3 |
| [Purchase Order](/administration/rules/purchase-order-line/) | 2 |
| [Product](/administration/rules/product/) | 3 |
| [Payment Term](/administration/rules/payment-term/) | 2 |
| [Quotation](/administration/rules/quotation-line/) | 2 |
| [Party](/administration/rules/party/) | 1 |
| [Customer](/administration/rules/customer/) | 1 |
| [Supplier](/administration/rules/supplier/) | 1 |
| [Customer Return](/administration/rules/customer-return/) | 1 |
