---
title: "Reports"
slug: /reports
sidebar_position: 15
description: "Run the analytical reports this application ships with."
---

# Reports

**Open it:** **Reports** in the menu (`/reports`).

A report answers a question about the data with a table, and sometimes a chart. The page explains it itself: *the questions this application answers, as its model defines them; each report runs against the live data when you open it.*

![Reports](/img/reports.jpg)

Choose a report to run it. Reports are grouped by the entity they are mainly about. Each is a **single read-only query**: a report cannot change data, and a query that is anything other than one read is refused when the application is generated, when it is stored, and again when it runs. Results are limited to 5,000 rows.

An application whose model declares no reports shows **This model declares no reports**. Reports are written in the model under `reports:`; add one and regenerate the application. Your application's own manual lists its reports under **Administration → Reports**.
