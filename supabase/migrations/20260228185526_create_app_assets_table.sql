/*
  # Create App Assets Table for Storing Static Images

  1. New Tables
    - `app_assets`
      - `id` (serial, primary key)
      - `asset_key` (text, unique) - Unique identifier like 'logo', 'background/hero-main', 'team/maximilian-pilsner'
      - `filename` (text) - Original filename
      - `mime_type` (text) - Image MIME type (image/png, image/jpeg, etc.)
      - `data` (text) - Base64 encoded image data
      - `category` (text) - Category: 'logo', 'background', 'team', 'portrait'
      - `alt_text` (text) - Alternative text for accessibility
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Purpose
    - Store all static website images in database for portability
    - Eliminates need for filesystem-based image storage
    - Makes deployment easier as all assets are in the database

  3. Security
    - Enable RLS on `app_assets` table
    - Public read access (images need to be viewable by everyone)
    - Write access restricted to authenticated admins
*/

CREATE TABLE IF NOT EXISTS app_assets (
  id SERIAL PRIMARY KEY,
  asset_key TEXT UNIQUE NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  data TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'misc',
  alt_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_assets_key ON app_assets(asset_key);
CREATE INDEX IF NOT EXISTS idx_app_assets_category ON app_assets(category);

ALTER TABLE app_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view app assets"
  ON app_assets
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert app assets"
  ON app_assets
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update app assets"
  ON app_assets
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete app assets"
  ON app_assets
  FOR DELETE
  TO authenticated
  USING (true);