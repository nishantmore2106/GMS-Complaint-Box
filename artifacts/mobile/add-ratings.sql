-- Add rating columns to complaints table
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS rating_feedback TEXT;
