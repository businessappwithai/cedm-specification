---
title: "Asset Depreciation"
sidebar_label: "Asset Depreciation"
sidebar_position: 3
description: "Represents the financial measurement of how an Asset's depreciable value is consumed over time or usage."
---

# Asset Depreciation

Represents the financial measurement of how an Asset's depreciable value is consumed over time or usage. AssetDepreciation translates an asset's economic consumption into an accounting measure. It is not a description of physical condition; an asset can be heavily depreciated while remaining operational, or have a high book value while requiring significant repair. Used by fixed-asset accounting, period close, financial reporting, asset valuation, disposal analysis, budgeting, management reporting, and repair/disposition economics. Asset identifies the resource. AssetDepreciation supplies the accounting method and resulting financial measures. RepairEstimate may compare estimated repair cost or sale value against net book value, but those are different business concepts. MaintenanceWorkOrder captures physical work and actual maintenance execution; depreciation captures accounting consumption. A depreciation schedule begins when an asset becomes subject to the applicable accounting policy, accumulates depreciation through accounting periods or usage, may be revised after approved accounting changes, and ends or is settled when the asset is disposed, retired, fully depreciated, or otherwise removed from the relevant accounting basis. A container acquired for 10,000 units of currency has a defined salvage value and useful life. Under STRAIGHT depreciation, its depreciable base is allocated over the useful life. A RepairEstimate later evaluates a 3,000-unit repair against its net book value and expected sale value; the depreciation record provides the accounting baseline but does not determine the repair decision by itself.

## Finding records

Open **Asset Depreciation** from the menu or from its card on the dashboard.

![The Asset Depreciation list](/img/entities/asset-depreciation-list.jpg)

The list shows Depreciation Method, Depreciation Rate, Salvage Value, Useful Life Months, Depreciable Base, Accumulated Depreciation, Net Book Value, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Creating a record

Choose **New** at the top of the list. The form opens on its own page, with the fields in sections. A badge beside each label names the control (Text, Dropdown, Date, and so on); a red star marks a required field; the question-mark icon shows that field's help; and a hint such as “max 300” shows the longest entry accepted.

![The Asset Depreciation form](/img/entities/asset-depreciation-new.jpg)

1. Fill in the fields described under [Fields](#fields).
2. These are required and must be completed before the record can be saved: **Depreciation Method**, **Accumulated Depreciation**, **Asset**.
3. For a dropdown that points at another window, pick the matching record; if the record you need does not exist yet, create it in its own window first. A dropdown may narrow to what you have already chosen, for example the states of the chosen country.
4. Choose **Create** (or **Save** in the toolbar). You return to the record, and it appears at the top of the list. If something is wrong the form says which field and why, and nothing is saved.

## Reading, changing and deleting a record

Click a row to open the record. Above the fields are the arrows that step through the list ("1 of 5"). Below them sit **Notes**, where anyone may leave a comment on the record, and the **Audit Trail**, which lists every change with who made it, when, and which fields changed.

- **Edit** (toolbar) makes the fields editable. Change them and choose **Save**; **Undo Changes** puts back what you changed and **Cancel Editing** leaves edit mode.
- **Copy Record** starts a new record from this one.
- **Delete Record** is available in edit mode and asks you to confirm; a record other records still depend on cannot be deleted.

Every change is also written to the [Audit Log](/administration/#audit-log).

## Fields

| Field | What you use | Rules | What to enter |
| --- | --- | --- | --- |
| Depreciation Method | Choice | Required | Defines the mathematical or business method used to allocate an asset's depreciable value over its useful life or usage. Drives depreciation calculations, period expense, net book value, forecasting, and financial reporting. The method must be interpreted together with depreciableBase, salvageValue, usefulLifeMonths, usage metrics, and the accounting policy governing the Asset. Allocates depreciable value systematically over the defined useful life, normally producing an approximately even periodic depreciation amount. Calculates depreciation using the asset's remaining depreciable value and remaining useful life under the organization's remaining-life policy. Applies a declining-balance approach in which depreciation is calculated at a defined rate against an appropriate declining carrying base. Allocates depreciation based on usage units or output relative to the expected total units, appropriate where consumption rather than elapsed time drives asset value reduction. Required because the same asset can produce materially different book values under different accounting methods. Choose one: Straight, Rem life, Red bal, Nbvslunit. |
| Depreciation Rate | Amount | Optional | The rate used by applicable depreciation methods to calculate the portion of the depreciable base recognized during a period. Used by declining-balance or other rate-driven calculations and for financial forecasting. Rate is method-dependent; it must not be interpreted as a universal percentage independent of depreciationMethod. Optional for methods where rate is derived from useful life or usage rather than directly supplied. |
| Salvage Value | Amount | Optional | The expected residual value that the asset's carrying amount should generally not depreciate below under the applicable accounting policy. Used to determine the depreciable base, depreciation limits, disposal analysis, and residual-value reporting. Salvage value is an accounting assumption and is distinct from current market sale value or an estimated sale amount in a RepairEstimate. Optional where policy assumes zero residual value or the value is maintained elsewhere. |
| Useful Life Months | Whole number | Optional | The expected number of months over which the asset's depreciable value is allocated under a time-based depreciation policy. Used for straight-line and remaining-life calculations, asset planning, forecasting, and depreciation schedules. Useful life is an accounting assumption about consumption of economic benefit and is not necessarily the physical service life or maintenance interval. Optional for usage-based methods or where useful life is derived from another policy. |
| Depreciable Base | Amount | Optional | The portion of the asset's value subject to depreciation after considering the applicable acquisition basis and residual-value rules. Provides the financial basis from which depreciation expense is calculated. It is related to Asset acquisition cost and salvage value but may differ because capitalization, impairment, revaluation, or accounting adjustments can change the depreciable basis. Optional when the base is calculated dynamically from other financial records. |
| Accumulated Depreciation | Amount | Required | The cumulative depreciation recognized against the asset under this schedule up to the relevant accounting point. Used to determine carrying value, period depreciation, disposal gain or loss, and financial reporting. It is an accumulated financial measure and should not be confused with physical wear, repair cost, or market-value reduction. Required with zero as the initial value so an asset with no depreciation recognized has an explicit financial state. |
| Net Book Value | Amount | Optional | The asset's carrying amount after recognized depreciation and other applicable accounting adjustments under this schedule. Used for balance-sheet reporting, disposal analysis, impairment assessment, management reporting, and asset valuation. Net book value is an accounting measure and should not be interpreted as market sale value, repair-adjusted value, or predicted disposition value. Optional when carrying value is calculated on demand from the asset's accounting history rather than stored. |
| Asset | Lookup | Required | Identifies the individual Asset whose financial depreciation is being measured. Connects depreciation calculations to the asset's acquisition, lifecycle, ownership, maintenance, and disposal history. Exactly one Asset is measured by a depreciation record. Asset is the physical/accountable resource; AssetDepreciation is the financial measurement of that resource. Pick a record from **Asset**. |
| Product | Lookup | Optional | Identifies the standardized product or equipment definition relevant to the depreciated asset. Supports fleet/class-level depreciation analysis, equipment reporting, and policy assignment. Zero or one Product may be linked when depreciation policy is associated with a product class or model. Product describes the reusable model; depreciation remains attached to the individual Asset and its accounting context. Pick a record from **Product**. |
| Currency | Lookup | Optional | Identifies the currency in which monetary depreciation values are expressed. Used to interpret depreciable base, accumulated depreciation, salvage value, and net book value in financial reporting. Zero or one Currency may be linked when currency is inherited from the accounting ledger or financial context. Currency gives monetary values their denomination and does not define the depreciation method or asset identity. Pick a record from **Currency**. |

## How it connects to other records
- A asset depreciation belongs to one **Asset**.
- A asset depreciation belongs to one **Product**.
- A asset depreciation belongs to one **Currency**.

## What happens when you save
Business rules run around the save. They are listed here and explained in full under [Business rules](/administration/rules/).

| Rule | When | Order |
| --- | --- | --- |
| Asset depreciation invariants before create | before a asset depreciation is created | 100 |
| Asset depreciation invariants before update | before a asset depreciation is changed | 100 |

## Who may use it

Anyone who holds a role with access to the **Asset Depreciation** window. Access is granted by role under [Roles and access](/administration/access/).
