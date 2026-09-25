-- =========================================================
-- PLOTIFY BANGLADESH - REAL ESTATE MARKETPLACE SCHEMA
-- Execute this script in your Supabase SQL Editor
-- =========================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Enums
DO $$ BEGIN
  CREATE TYPE property_type_enum AS ENUM ('apartment', 'plot', 'duplex', 'penthouse', 'commercial', 'building');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE property_purpose_enum AS ENUM ('sale', 'rent');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE area_unit_enum AS ENUM ('sqft', 'katha', 'bigha', 'decimal');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE gas_type_enum AS ENUM ('titas_pipeline', 'lpg_cylinder', 'none');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Profiles Table (RBAC: personal, business, admin)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'personal' CHECK (role IN ('personal', 'business', 'admin')),
  avatar_url TEXT,
  business_name VARCHAR(255),
  organization_name VARCHAR(255),
  is_verified BOOLEAN DEFAULT FALSE,
  verification_status VARCHAR(30) DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  nid_number VARCHAR(50),
  upgrade_status VARCHAR(30) DEFAULT 'none' CHECK (upgrade_status IN ('none', 'pending_approval', 'approved', 'rejected')),
  nid_url TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Properties Table
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(15, 2) NOT NULL,
  price_type VARCHAR(20) DEFAULT 'fixed' CHECK (price_type IN ('fixed', 'negotiable')),
  purpose property_purpose_enum NOT NULL DEFAULT 'sale',
  property_type property_type_enum NOT NULL DEFAULT 'apartment',
  approval_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  
  -- Location (Bangladesh Hierarchy)
  division VARCHAR(50) NOT NULL DEFAULT 'Dhaka',
  city VARCHAR(50) NOT NULL DEFAULT 'Dhaka',
  district VARCHAR(50) NOT NULL DEFAULT 'Dhaka',
  area VARCHAR(100) NOT NULL, -- e.g. Gulshan 2, Banani, Uttara Sector 11, Bashundhara R/A Block C
  address TEXT NOT NULL,
  landmark VARCHAR(255),
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  
  -- Dimensions & Rooms
  size NUMERIC(10, 2) NOT NULL,
  size_unit area_unit_enum NOT NULL DEFAULT 'sqft',
  bedrooms INT,
  bathrooms INT,
  balconies INT,
  floor_number INT,
  total_floors INT,
  facing VARCHAR(30),

  -- Bangladesh specific infrastructure & legal
  gas_connection gas_type_enum DEFAULT 'titas_pipeline',
  electricity_type VARCHAR(20) DEFAULT 'prepaid' CHECK (electricity_type IN ('prepaid', 'postpaid')),
  wasa_water BOOLEAN DEFAULT true,
  generator_backup BOOLEAN DEFAULT true,
  lift_count INT DEFAULT 1,
  parking_spaces INT DEFAULT 1,
  handover_year INT,
  is_ready BOOLEAN DEFAULT true,

  -- Media & Highlights
  featured_image TEXT,
  images TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'under_offer', 'sold', 'rented')),

  -- Seller Details
  seller_type VARCHAR(20) DEFAULT 'owner' CHECK (seller_type IN ('owner', 'developer', 'agent')),
  seller_name VARCHAR(100) NOT NULL,
  seller_phone VARCHAR(20) NOT NULL,
  seller_whatsapp VARCHAR(20),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Inquiries Table (Buyer leads)
CREATE TABLE IF NOT EXISTS public.property_inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  buyer_name VARCHAR(100) NOT NULL,
  buyer_phone VARCHAR(20) NOT NULL,
  buyer_email VARCHAR(100),
  message TEXT NOT NULL,
  scheduled_visit_date DATE,
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'scheduled', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Saved Properties (Favorites)
CREATE TABLE IF NOT EXISTS public.saved_properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_properties ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies
-- Profiles:
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Properties:
-- Public can view only approved properties, or owners can view own, or admin can view all
CREATE POLICY "Approved properties are viewable by everyone" 
ON public.properties FOR SELECT 
USING (
  approval_status = 'approved' 
  OR auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can insert property listings" 
ON public.properties FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Owners and admins can update properties" 
ON public.properties FOR UPDATE 
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Owners and admins can delete properties" 
ON public.properties FOR DELETE 
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Inquiries:
CREATE POLICY "Anyone can submit inquiry" 
ON public.property_inquiries FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Property owners and admins can view inquiries"
ON public.property_inquiries FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE properties.id = property_inquiries.property_id 
    AND (properties.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  )
);

-- Saved Properties:
CREATE POLICY "Users can manage saved properties"
ON public.saved_properties FOR ALL
USING (auth.uid() = user_id);

-- 8. Trigger to create profile automatically on auth user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    role,
    organization_name,
    business_name,
    is_verified,
    verification_status,
    upgrade_status
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'phone', '01700000000'),
    COALESCE(new.raw_user_meta_data->>'role', 'personal'),
    COALESCE(new.raw_user_meta_data->>'organization_name', new.raw_user_meta_data->>'organizationName', null),
    COALESCE(new.raw_user_meta_data->>'organization_name', new.raw_user_meta_data->>'organizationName', new.raw_user_meta_data->>'business_name', null),
    false,
    CASE WHEN (new.raw_user_meta_data->>'role' = 'business') THEN 'pending' ELSE 'unverified' END,
    CASE WHEN (new.raw_user_meta_data->>'role' = 'business') THEN 'pending_approval' ELSE 'none' END
  )
  ON CONFLICT (id) DO UPDATE SET
    organization_name = EXCLUDED.organization_name,
    business_name = EXCLUDED.business_name;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Indexes for High-Performance Real Estate Search
CREATE INDEX IF NOT EXISTS idx_properties_approval ON public.properties(approval_status);
CREATE INDEX IF NOT EXISTS idx_properties_purpose ON public.properties(purpose);
CREATE INDEX IF NOT EXISTS idx_properties_type ON public.properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_division ON public.properties(division);
CREATE INDEX IF NOT EXISTS idx_properties_area ON public.properties(area);
CREATE INDEX IF NOT EXISTS idx_properties_price ON public.properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON public.properties(created_at DESC);

-- =========================================================
-- 10. Ploti AI Persistent Chat History & Memory
-- =========================================================
CREATE TABLE IF NOT EXISTS public.ai_chat_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Authenticated users can only manage their own conversations
CREATE POLICY "Users can view their own chat history"
ON public.ai_chat_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat messages"
ON public.ai_chat_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat history"
ON public.ai_chat_history FOR DELETE
USING (auth.uid() = user_id);

-- Performance Indexes for session grouping and chronological order
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_user_session ON public.ai_chat_history(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_created_at ON public.ai_chat_history(created_at ASC);

