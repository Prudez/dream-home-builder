-- 009_balcony_any_floor.sql
-- Balcony is no longer upper-floors-only. Data-only change: the upper_only
-- column and its enforcement mechanism (Palette.jsx's floor-0 filter) stay
-- exactly as Phase 7 built them — generic, and reusable by any future room
-- type — only balcony's own flag flips back to the column's own default
-- (false), the same state every other room type is already in.

UPDATE dreamhome.catalog_rooms SET upper_only = false WHERE key = 'balcony';
