-- `sys_window.icon` — what an admin card on the dashboard draws.
--
-- `sys_table` and `sys_category` have carried an icon since m0001 and m0005, so
-- a business entity's card and a category's heading are both drawn from the
-- dictionary. A window had nothing, and the dashboard filled the gap with a map
-- from window *name* to an icon and a route, written into the frontend. A
-- window the dictionary added and that map did not know about was dropped from
-- the screen entirely — silently, because the lookup simply missed.
--
-- A lucide icon name, taken as written, exactly like `sys_table.icon`: nothing
-- here carries lucide's catalogue, so an unknown name renders a placeholder
-- rather than being a diagnostic.
ALTER TABLE sys_window
    ADD COLUMN IF NOT EXISTS icon VARCHAR(100);
