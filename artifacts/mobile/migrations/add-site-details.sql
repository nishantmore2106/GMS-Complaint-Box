-- Add logo_url and phone columns to sites table
ALTER TABLE sites ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS phone TEXT;

-- Update existing sites with placeholder if needed, though better to leave NULL
COMMENT ON COLUMN sites.logo_url IS 'URL to the site logo image';
COMMENT ON COLUMN sites.phone IS 'Contact phone number for the site itself';
