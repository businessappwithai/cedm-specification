---
title: "Party Role"
sidebar_position: 10
description: "The business rules that run on Party Role."
---

# Rules on Party Role

## Party role invariants before create

Runs before a party role is created; order 100. In **Business Rules** it is listed as `partyRoleInvariantsBeforeCreate`.

- **When** “Valid From” is filled in and “Valid To” is filled in and “Valid To” < “Valid From”: **Refuses the save** — “Valid To cannot be earlier than valid from.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Party role invariants before update

Runs before a party role is changed; order 100. In **Business Rules** it is listed as `partyRoleInvariantsBeforeUpdate`.

- **When** “Valid From” is filled in and “Valid To” is filled in and “Valid To” < “Valid From”: **Refuses the save** — “Valid To cannot be earlier than valid from.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

