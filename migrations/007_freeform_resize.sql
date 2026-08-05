-- 007_freeform_resize.sql
-- Removes per-room-type min/max size constraints. Rooms are now resizable
-- to any size bounded only by the plot dimensions and collision with other
-- rooms (enforced client-side against COLS/ROWS and a universal 1x1-cell
-- floor, not by catalog data). default_w/default_h remain — they still
-- size a room at initial placement.

ALTER TABLE dreamhome.catalog_rooms
  DROP COLUMN min_w,
  DROP COLUMN min_h,
  DROP COLUMN max_w,
  DROP COLUMN max_h;
