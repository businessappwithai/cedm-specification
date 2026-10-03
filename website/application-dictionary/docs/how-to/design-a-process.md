---
title: "Design a process"
sidebar_position: 6
description: "Create a task automatically when a record reaches a state."
---

# Design a process

**Goal:** when a *Party* is blocked, create a high-priority task asking someone to resolve it.

1. Open the [Workflow Designer](../windows/workflow-definitions.md) and choose **+ New Workflow**.
2. **Name**: *Party blocked follow-up*. **Entity**: *Party*. **Trigger on**: **UPDATE**. Create it.
3. In the designer, under **THEN**, choose **Add a step** and pick **CreateEntity**. Choose the entity **Task** and fill in its fields: a code, a name such as `Resolve party {{display_name}}`, and a priority. Values in double braces are taken from the record that triggered the process.
4. Choose **Save Changes**.
5. Start it with a rule: in [Business Rules](../windows/rules.md), add a rule on *Party*, operation **UPDATE**, whose condition is `status == "BLOCKED"` and whose **action** is `trigger-workflow` naming *Party blocked follow-up*.
6. Block a party, then check the [Workflow Monitor](../windows/workflows.md): the run is listed, and the new **Task** exists.

![The workflow designer](/img/workflow-edit.jpg)

If a step fails the run stops and the failure is logged; the record is still saved.
