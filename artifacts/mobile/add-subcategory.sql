-- Add subcategory column to complaints table
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS subcategory TEXT;
