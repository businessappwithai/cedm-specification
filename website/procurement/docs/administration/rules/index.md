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
| [Purchase Requisition](/administration/rules/purchase-requisition-line/) | 2 |
| [Request For Quotation](/administration/rules/request-for-quotation-line/) | 2 |
| [Supplier Quotation](/administration/rules/supplier-quotation/) | 3 |
| [Supplier Quotation](/administration/rules/supplier-quotation-line/) | 2 |
| [Purchase Order](/administration/rules/purchase-order/) | 3 |
| [Purchase Order](/administration/rules/purchase-order-line/) | 2 |
| [Goods Receipt](/administration/rules/goods-receipt/) | 3 |
| [Goods Receipt](/administration/rules/goods-receipt-line/) | 2 |
| [Supplier Claim](/administration/rules/supplier-claim/) | 3 |
| [Supplier Claim Resolution](/administration/rules/supplier-claim-resolution/) | 3 |
| [Supplier Credit Note](/administration/rules/supplier-credit-note/) | 3 |
| [Supplier Credit Note](/administration/rules/supplier-credit-note-line/) | 2 |
| [Supplier Credit Note Application](/administration/rules/supplier-credit-note-application/) | 3 |
| [Supplier Debit Note](/administration/rules/supplier-debit-note/) | 3 |
| [Supplier Debit Note](/administration/rules/supplier-debit-note-line/) | 2 |
| [Supplier Debit Note Application](/administration/rules/supplier-debit-note-application/) | 3 |
| [Supplier Performance Assessment](/administration/rules/supplier-performance-assessment/) | 3 |
| [Product](/administration/rules/product/) | 3 |
| [Invoice](/administration/rules/invoice/) | 3 |
| [Invoice](/administration/rules/invoice-line/) | 2 |
| [Party](/administration/rules/party/) | 1 |
| [Supplier](/administration/rules/supplier/) | 1 |
| [Purchase Requisition](/administration/rules/purchase-requisition/) | 1 |
| [Request For Quotation](/administration/rules/request-for-quotation/) | 1 |
| [Supplier Return](/administration/rules/supplier-return/) | 1 |
