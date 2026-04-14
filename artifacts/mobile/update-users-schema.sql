-- Add display_id to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_id TEXT;

-- Update existing users with a default display_id if they don't have one
UPDATE users 
SET display_id = CASE 
    WHEN role = 'founder' THEN 'FND-' || substr(id::text, 1, 4)
    WHEN role = 'supervisor' THEN 'SUP-' || substr(id::text, 1, 4)
    ELSE 'ID-' || substr(id::text, 1, 4)
END
WHERE display_id IS NULL;

-- Ensure sites has some extra columns if they were missed
ALTER TABLE sites ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS client_phone TEXT;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS authority_name TEXT;
