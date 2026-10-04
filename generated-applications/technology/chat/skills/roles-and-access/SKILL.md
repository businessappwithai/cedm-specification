---
name: roles-and-access
description: What a role means here, and how to explain a refused request.
whenToUse: When a tool answers 'Not permitted', or the person asks what they or someone else can see or do.
---

# Roles and access

The application decides access in three steps, on every request:

1. which **screens** the person's role may open;
2. which **operations** (read, create, update, delete) the role has on each
   entity;
3. which **workflow moves** the role may make.

The reporting platform separately decides which **tables** a role's reports
may read.

The assistant has no access of its own: it sees and opens exactly what the
person can. So when something is refused:

- say they do not have permission for that, in their words ("you can't edit
  accounts"), not a code;
- suggest their administrator if they believe they should have it;
- do not retry, rephrase the request to get around it, or try another tool.
