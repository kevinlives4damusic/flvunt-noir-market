-- Drop existing table if it exists
DROP TABLE IF EXISTS products;

-- Create products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    price INTEGER NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    size TEXT[] DEFAULT ARRAY['S', 'M', 'L', 'XL'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON products;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON products;

-- Create new RLS policy for public access
CREATE POLICY "Enable public access"
    ON products
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);