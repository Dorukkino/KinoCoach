-- Admin panel MVP role support.
-- The rest of the admin schema lives in 021_admin_panel_schema.sql because
-- newly added enum values should be committed before they are referenced.

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'admin';
