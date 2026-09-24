# PostgreSQL migrations

Migrations are plain SQL so they remain portable across migration runners. Apply
`migrations/*.up.sql` in filename order and use the matching `.down.sql` for
local rollback. The application owns the schema; PostgreSQL is the source of
truth for catalog and import state.
