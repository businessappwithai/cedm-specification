---
title: "Address"
sidebar_position: 2
description: "The business rules that run on Address."
---

# Rules on Address

## Address invariants before create

Runs before a address is created; order 100. In **Business Rules** it is listed as `addressInvariantsBeforeCreate`.

- **When** “City” is empty and “City Name” is empty: **Refuses the save** — “Choose the city, or give its name when it is not in the list.”.

![The Address invariants before create rule in the editor](/img/rules/address-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Address invariants before update

Runs before a address is changed; order 100. In **Business Rules** it is listed as `addressInvariantsBeforeUpdate`.

- **When** “City” is empty and “City Name” is empty: **Refuses the save** — “Choose the city, or give its name when it is not in the list.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

