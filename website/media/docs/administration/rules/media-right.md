---
title: "Media Content"
sidebar_position: 4
description: "The business rules that run on Media Content."
---

# Rules on Media Content

## Media right invariants before create

Runs before a media content is created; order 100. In **Business Rules** it is listed as `mediaRightInvariantsBeforeCreate`.

- **When** “Valid From” is filled in and “Valid To” is filled in and “Valid To” < “Valid From”: **Refuses the save** — “Valid To cannot be earlier than valid from.”.

![The Media right invariants before create rule in the editor](/img/rules/media-right-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Media right invariants before update

Runs before a media content is changed; order 100. In **Business Rules** it is listed as `mediaRightInvariantsBeforeUpdate`.

- **When** “Valid From” is filled in and “Valid To” is filled in and “Valid To” < “Valid From”: **Refuses the save** — “Valid To cannot be earlier than valid from.”.

![The Media right invariants before update rule in the editor](/img/rules/media-right-invariants-before-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

