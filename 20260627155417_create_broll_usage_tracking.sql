/*
# Create B-Roll Blitz usage tracking table

1. New Tables
- `broll_usage`
- `id` (uuid, primary key) - Unique identifier for each row
- `fingerprint` (text, not null) - Client-generated fingerprint to track daily usage
- `usage_date` (date, not null) - The date this usage record applies to
- `searches_count` (integer, not null, default 0) - Number of searches used today
- `max_searches` (integer, not null, default 5) - Maximum allowed searches per day
- `created_at` (timestamptz) - When the record was created
- `updated_at` (timestamptz) - When the record was last updated
2. Indexes
- Unique index on (fingerprint, usage_date) to prevent duplicate daily records
3. Security
- Enable RLS on `broll_usage`.
- Allow anon + authenticated CRUD because the app has no sign-in and data is per-fingerprint.
*/

CREATE TABLE IF NOT EXISTS broll_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint text NOT NULL,
  usage_date date NOT NULL DEFAULT CURRENT_DATE,
  searches_count integer NOT NULL DEFAULT 0,
  max_searches integer NOT NULL DEFAULT 5,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_broll_usage_fingerprint_date ON broll_usage (fingerprint, usage_date);

ALTER TABLE broll_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_broll_usage" ON broll_usage;
CREATE POLICY "anon_select_broll_usage" ON broll_usage FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_broll_usage" ON broll_usage;
CREATE POLICY "anon_insert_broll_usage" ON broll_usage FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_broll_usage" ON broll_usage;
CREATE POLICY "anon_update_broll_usage" ON broll_usage FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_broll_usage" ON broll_usage;
CREATE POLICY "anon_delete_broll_usage" ON broll_usage FOR DELETE
  TO anon, authenticated USING (true);
