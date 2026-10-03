---
title: "Container"
sidebar_position: 4
description: "The business rules that run on Container."
---

# Rules on Container

## Container invariants before create

Runs before a container is created; order 100. In **Business Rules** it is listed as `containerInvariantsBeforeCreate`.

- **When** “Tare Weight” is filled in and “Tare Weight” < 0: **Refuses the save** — “Tare Weight cannot be negative.”.
- **When** “Max Gross Weight” is filled in and “Max Gross Weight” < 0: **Refuses the save** — “Max Gross Weight cannot be negative.”.

![The Container invariants before create rule in the editor](/img/rules/container-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Container invariants before update

Runs before a container is changed; order 100. In **Business Rules** it is listed as `containerInvariantsBeforeUpdate`.

- **When** “Tare Weight” is filled in and “Tare Weight” < 0: **Refuses the save** — “Tare Weight cannot be negative.”.
- **When** “Max Gross Weight” is filled in and “Max Gross Weight” < 0: **Refuses the save** — “Max Gross Weight cannot be negative.”.

![The Container invariants before update rule in the editor](/img/rules/container-invariants-before-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

