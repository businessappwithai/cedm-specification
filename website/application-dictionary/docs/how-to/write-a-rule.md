---
title: "Write a business rule"
sidebar_position: 5
description: "Refuse a bad save with a clear message."
---

# Write a business rule

**Goal:** refuse to save an Address that has neither a city nor a city name, and tell the user what to do.

1. Open [Business Rules](../windows/rules.md) and choose **New Rule**.
2. **Entity**: choose *Address*. **Rule Name**: *Address needs a city*. **Trigger Operation**: **CREATE**.
3. In the **Decision Table**, leave the IF header as **Select…** and write the condition in the cell:

   `city_id == null and city_name == null`

4. In the **THEN** columns set **action** to `prevent` and **message** to `"Choose the city, or give its name."`
5. Choose **Test Rule**, paste a sample such as `{"city_id": null, "city_name": null}` and check the rule refuses it; then try `{"city_name": "Oslo"}` and check it does not.
6. Choose **Create Rule**.

![Create Business Rule](/img/rules-new.jpg)

Now saving an Address with neither field shows the message and nothing is saved. Add a second row, or a rule for **UPDATE**, to guard changes too.

**Switch it off** with the **Active** switch in the rule's details. **Edit it** from the pencil in the list.

:::tip
Write the message for the person who sees it: say what to change, not what failed.
:::
