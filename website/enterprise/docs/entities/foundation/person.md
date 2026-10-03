---
title: "Person"
sidebar_label: "Person"
sidebar_position: 18
description: "Person is the individual specialization of Party, not a business role."
---

# Person

Person is the individual specialization of Party, not a business role. Party identifies the individual; Person supplies intrinsic individual details; PartyRole determines how the person participates. Used for customers, employees, agents, owners, contractors, and other roles without duplicating individual identity. Party → Person establishes intrinsic identity; Party → PartyRole establishes business participation; Organization links provide employment or other organizational context. Create/maintain Party → create Person specialization → establish PartyRole → apply role-specific qualification/authorization → execute transactions. Ending one role does not end the person or other roles. Person specialization follows Party identity while role eligibility remains independently controlled by PartyRole. One individual may be both an Employee and Customer. The same Party and Person specialization is reused while separate PartyRoles govern employment and customer processes.

## Finding records

Open **Person** from the menu or from its card on the dashboard.

![The Person list](/img/entities/person-list.jpg)

The list shows Party, Title, Given Name, Middle Name, Family Name, Preferred Name, Date Of Birth, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Creating a record

Choose **New** at the top of the list. The form opens on its own page, with the fields in sections. A badge beside each label names the control (Text, Dropdown, Date, and so on); a red star marks a required field; the question-mark icon shows that field's help; and a hint such as “max 300” shows the longest entry accepted.

![The Person form](/img/entities/person-new.jpg)

1. Fill in the fields described under [Fields](#fields).
2. These are required and must be completed before the record can be saved: **Party**, **Given Name**, **Family Name**, **Party Type**, **Display Name**, **Status**.
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
| Party | Lookup | Required, Unique | Canonical Party identity represented by this Person specialization. Connects person-specific data to common Party identity and all PartyRoles. Exactly one Person specialization may represent a Party classified as PERSON. Ensures transactions and roles use one stable person identity. Required to prevent duplicate identity. Pick a record from **Party**. |
| Title | Text | Up to 50 characters | Personal title. documents and presentation. presentation attribute. supports person display. optional. |
| Given Name | Text | Required, Up to 150 characters | Given name. identity and documents. intrinsic person identity. identification. required. |
| Middle Name | Text | Up to 150 characters | Middle name. identity and documents. intrinsic person identity. identification. optional. |
| Family Name | Text | Required, Up to 150 characters | Family name. identity and documents. intrinsic person identity. identification. required. |
| Preferred Name | Text | Up to 150 characters | Preferred display name. communication and UI. presentation not canonical identity. human interaction. optional. |
| Date Of Birth | Date | Optional | Date of birth. processes requiring verified individual identity. sensitive person attribute subject to access policy. eligibility/verification where applicable. optional. |
| Gender | Choice | Optional | Gender classification where required by the business process. permitted business processes only. person attribute and not role. process-specific. optional. The gender of the person is female; set it when that is what the business means for this record. The gender of the person is male; set it when that is what the business means for this record. The gender of the person is non binary; set it when that is what the business means for this record. The gender of the person is other; set it when that is what the business means for this record. The gender of the person is unspecified; set it when that is what the business means for this record. Choose one: Female, Male, Non binary, Other, Unspecified. |
| Nationality | Lookup | Optional | The country whose nationality the person holds. Chosen from the list of countries; used by identity and compliance processes. Not Party identity; process-specific. Optional. Pick a record from **Country**. |
| Party Type | Choice | Required | Identifies whether the party is a person or an organization. Determines which party specialization is applicable and prevents business processes from interpreting an organization as an individual or vice versa. Used to select Person or Organization details and to drive validation, forms, search, reporting, and role assignment. PERSON requires the Person specialization; ORGANIZATION requires the Organization specialization. The party represents an individual human being. The party represents a legal, commercial, governmental, nonprofit, or other organized body. Required because the party's specialization and applicable business semantics depend on it. Choose one: Person, Organization. |
| Display Name | Text | Required, Up to 300 characters | The business-facing name by which the party is normally displayed and recognized. Provides a consistent human-readable representation independent of whether the party is a person or organization. Used in forms, search results, documents, transactions, reports, notifications, and user interfaces. It is a presentation identity for the Party and does not replace legal names, person names, or organization registration names stored by specializations. Required so every party can be unambiguously presented to users and business processes. |
| Status | Choice | Required | Controls whether the party may participate in new business activity. Represents the operational lifecycle of the party relationship with the enterprise, not the party's legal existence. Used by onboarding, transaction validation, account maintenance, compliance, and deactivation processes. A party may remain historically referenced after becoming INACTIVE, BLOCKED, or RETIRED; lifecycle state therefore does not imply deletion. The party is available for normal business participation. The party is retained but is not normally eligible for new activity. Business activity is restricted pending resolution of a business, risk, compliance, or operational condition. The party relationship is permanently ended for normal operational use while historical references remain valid. Required because downstream processes must know whether participation is currently permitted. Choose one: Active, Inactive, Blocked, Retired. |
| External Reference | Text | Up to 200 characters | An identifier assigned to the party by an external system or business partner. Preserves a cross-system identity that allows CEDM to reconcile a party with another master-data system. Used for integrations, migration, reconciliation, EDI, synchronization, and external lookup. It is not the canonical CEDM identity; Party.partyId remains the internal identity while externalReference provides interoperability context. Optional when no external system identity exists or when the external identity is maintained elsewhere. |

## How it connects to other records
- A person has one **Party**.
- A person has many **ERP** records.
- A person has many **Address** records.
- A person has many **Party Role** records.

## Who may use it

Anyone who holds a role with access to the **Person** window. Access is granted by role under [Roles and access](/administration/access/).
