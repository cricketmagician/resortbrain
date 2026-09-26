-- ==============================================================================
-- RESORTBRAIN v2.0 - MASTER SUPABASE SQL SCHEMA & SEED SCRIPT
-- Project Ref: afeudwengrjhziiuircm (https://afeudwengrjhziiuircm.supabase.co)
-- Multi-Tenant Luxury Hotel OS: Bedside QRs, Dynamic Stay PINs, Google Auth, KDS, & Billing
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables cleanly if re-running (safe order)
DROP TABLE IF EXISTS push_subscriptions CASCADE;
DROP TABLE IF EXISTS outbox_events CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS request_events CASCADE;
DROP TABLE IF EXISTS service_requests CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS menu_categories CASCADE;
DROP TABLE IF EXISTS stays CASCADE;
DROP TABLE IF EXISTS guests CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS floors CASCADE;
DROP TABLE IF EXISTS invites CASCADE;
DROP TABLE IF EXISTS memberships CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS usage_records CASCADE;
DROP TABLE IF EXISTS feature_flags CASCADE;
DROP TABLE IF EXISTS hotels CASCADE;
DROP TABLE IF EXISTS plans CASCADE;

-- ==============================================================================
-- 2. CORE SAAS TENANCY & PLANS
-- ==============================================================================
CREATE TABLE plans (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  max_rooms INT NOT NULL,
  max_staff INT NOT NULL,
  price_paise BIGINT NOT NULL,
  billing_period VARCHAR(32) DEFAULT 'monthly',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO plans (id, name, max_rooms, max_staff, price_paise) VALUES
  ('starter', 'Boutique Resort', 25, 10, 499900),
  ('growth', 'Luxury Heritage', 100, 50, 1499900),
  ('enterprise', 'Palace & Island Chain', 500, 250, 4999900)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  tagline VARCHAR(255),
  logo_url TEXT,
  banner_url TEXT,
  currency VARCHAR(8) DEFAULT 'INR',
  tax_rate_percent NUMERIC(5, 2) DEFAULT 18.00,
  service_charge_percent NUMERIC(5, 2) DEFAULT 5.00,
  plan_id VARCHAR(64) REFERENCES plans(id) DEFAULT 'growth',
  status VARCHAR(32) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 3. PROFILES & AUTH SYNCHRONIZATION (Google OAuth Integration)
-- ==============================================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  phone VARCHAR(32),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(32) NOT NULL DEFAULT 'hotel_manager', -- 'platform_admin', 'hotel_manager', 'front_desk', 'kitchen_chef', 'housekeeping'
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hotel_id, user_id)
);

-- Automatic Auth Trigger: When someone logs in with Google or Email,
-- Supabase automatically populates public.profiles and assigns hotel manager access!
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_hotel_id UUID;
BEGIN
  -- 1. Insert into public.profiles
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();

  -- 2. Find primary hotel to assign initial membership
  SELECT id INTO default_hotel_id FROM public.hotels WHERE slug = 'grand-azure' LIMIT 1;
  IF default_hotel_id IS NULL THEN
    SELECT id INTO default_hotel_id FROM public.hotels LIMIT 1;
  END IF;

  -- 3. Assign manager membership
  IF default_hotel_id IS NOT NULL THEN
    INSERT INTO public.memberships (hotel_id, user_id, role)
    VALUES (default_hotel_id, NEW.id, 'hotel_manager')
    ON CONFLICT (hotel_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate Auth Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 4. ROOMS, BEDSIDE QRS & DYNAMIC STAY PINS
-- ==============================================================================
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_number VARCHAR(32) NOT NULL,
  room_type VARCHAR(64) NOT NULL,
  status VARCHAR(32) DEFAULT 'available', -- 'available', 'occupied', 'cleaning', 'maintenance'
  qr_code_token VARCHAR(128) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hotel_id, room_number)
);

CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(32),
  email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE stays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  status VARCHAR(32) DEFAULT 'active', -- 'active', 'checked_out', 'cancelled'
  check_in TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  check_out TIMESTAMPTZ NOT NULL,
  stay_token VARCHAR(255) UNIQUE NOT NULL,
  checkin_pin VARCHAR(8) NOT NULL, -- Dynamic 4-digit PIN for Bedside Security
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 5. MENU & ROOM DINING (F&B)
-- ==============================================================================
CREATE TABLE menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name VARCHAR(128) NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0
);

CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price_paise BIGINT NOT NULL, -- Integer minor units
  image_url TEXT,
  is_veg BOOLEAN DEFAULT true,
  allergen_tags TEXT[] DEFAULT '{}',
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 6. ORDERS, BUTLER REQUESTS & BILLING
-- ==============================================================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  stay_id UUID NOT NULL REFERENCES stays(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  order_number VARCHAR(32) NOT NULL,
  status VARCHAR(32) DEFAULT 'pending', -- 'pending', 'accepted', 'preparing', 'ready', 'delivered'
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal_paise BIGINT NOT NULL,
  tax_paise BIGINT NOT NULL,
  service_charge_paise BIGINT NOT NULL,
  total_paise BIGINT NOT NULL,
  special_instructions TEXT,
  idempotency_key VARCHAR(128) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  stay_id UUID NOT NULL REFERENCES stays(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  category VARCHAR(64) NOT NULL, -- 'housekeeping', 'amenities', 'front_desk', 'maintenance'
  title VARCHAR(255) NOT NULL,
  details TEXT,
  status VARCHAR(32) DEFAULT 'created', -- 'created', 'acknowledged', 'in_progress', 'completed'
  priority VARCHAR(32) DEFAULT 'normal',
  sla_minutes INT DEFAULT 15,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  stay_id UUID NOT NULL REFERENCES stays(id) ON DELETE CASCADE,
  invoice_number VARCHAR(64) UNIQUE NOT NULL,
  subtotal_paise BIGINT NOT NULL DEFAULT 0,
  tax_paise BIGINT NOT NULL DEFAULT 0,
  service_charge_paise BIGINT NOT NULL DEFAULT 0,
  total_paise BIGINT NOT NULL DEFAULT 0,
  status VARCHAR(32) DEFAULT 'draft', -- 'draft', 'issued', 'paid'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE SET NULL,
  actor_id VARCHAR(128),
  actor_role VARCHAR(64),
  action VARCHAR(128) NOT NULL,
  target_resource VARCHAR(128) NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE stays ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Public / Anonymous Read for Guest QR & Menu
CREATE POLICY "Public read for active hotels" ON hotels FOR SELECT USING (status = 'active');
CREATE POLICY "Public read for rooms" ON rooms FOR SELECT USING (true);
CREATE POLICY "Public read for guests" ON guests FOR SELECT USING (true);
CREATE POLICY "Public read for menu categories" ON menu_categories FOR SELECT USING (true);
CREATE POLICY "Public read for menu items" ON menu_items FOR SELECT USING (is_available = true);
CREATE POLICY "Public read for active stays" ON stays FOR SELECT USING (status = 'active');
CREATE POLICY "Public read for profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Public read for memberships" ON memberships FOR SELECT USING (true);

-- Orders & Requests Permissions
CREATE POLICY "Public insert and read orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public insert and read requests" ON service_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read and update invoices" ON invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Insert audit logs" ON audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Read audit logs" ON audit_logs FOR SELECT USING (true);

-- ==============================================================================
-- 8. INITIAL SEED DATA (Hotels, Rooms, Bedside QRs, Stay PINs, Gourmet Menu)
-- ==============================================================================

-- A. Insert 3 Hotels
INSERT INTO hotels (id, slug, name, tagline, currency, tax_rate_percent, service_charge_percent)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'grand-azure', 'Grand Azure Resort & Spa', 'Ultra-Luxury Coastal Sanctuary', 'INR', 18.00, 5.00),
  ('22222222-2222-2222-2222-222222222222', 'the-heritage-palace', 'The Heritage Palace & Fort', 'Royal Rajasthan Opulence', 'INR', 18.00, 5.00),
  ('33333333-3333-3333-3333-333333333333', 'the-leela-palace', 'The Leela Palace Resort & Spa', 'Modern Elegance & Tranquility', 'INR', 18.00, 5.00)
ON CONFLICT (id) DO NOTHING;

-- B. Insert Rooms for Grand Azure Resort
INSERT INTO rooms (id, hotel_id, room_number, room_type, status, qr_code_token)
VALUES
  ('a0000101-0000-0000-0000-000000000101', '11111111-1111-1111-1111-111111111111', 'Room 101', 'Oceanfront Pool Villa', 'occupied', 'QR_GRAND-AZURE_101'),
  ('a0000102-0000-0000-0000-000000000102', '11111111-1111-1111-1111-111111111111', 'Room 102', 'Royal Azure Suite', 'occupied', 'QR_GRAND-AZURE_102'),
  ('a0000204-0000-0000-0000-000000000204', '11111111-1111-1111-1111-111111111111', 'Villa 204', 'Private Overwater Bungalow', 'occupied', 'QR_GRAND-AZURE_204'),
  ('a0000304-0000-0000-0000-000000000304', '11111111-1111-1111-1111-111111111111', 'Suite 304', 'Presidential Penthouse', 'occupied', 'QR_GRAND-AZURE_304'),
  ('a0000105-0000-0000-0000-000000000105', '11111111-1111-1111-1111-111111111111', 'Room 105', 'Cliffside Sunset Villa', 'available', 'QR_GRAND-AZURE_105')
ON CONFLICT (id) DO NOTHING;

-- C. Insert Guests
INSERT INTO guests (id, hotel_id, name, email, phone)
VALUES
  ('b0000101-0000-0000-0000-000000000101', '11111111-1111-1111-1111-111111111111', 'Kabir Mehta', 'kabir@azure.com', '+919876543210'),
  ('b0000102-0000-0000-0000-000000000102', '11111111-1111-1111-1111-111111111111', 'Dr. Radhika Sen', 'radhika@azure.com', '+919876543211'),
  ('b0000204-0000-0000-0000-000000000204', '11111111-1111-1111-1111-111111111111', 'Alexander Wright', 'alex@azure.com', '+14155552671'),
  ('b0000304-0000-0000-0000-000000000304', '11111111-1111-1111-1111-111111111111', 'Vikram Oberoi (VIP)', 'vikram@azure.com', '+919811122233')
ON CONFLICT (id) DO NOTHING;

-- D. Insert Active Stays with Bedside PINs
INSERT INTO stays (id, hotel_id, room_id, guest_id, status, checkin_pin, stay_token, check_in, check_out)
VALUES
  ('c0000101-0000-0000-0000-000000000101', '11111111-1111-1111-1111-111111111111', 'a0000101-0000-0000-0000-000000000101', 'b0000101-0000-0000-0000-000000000101', 'active', '1014', 'stay_token_azure_101', NOW() - INTERVAL '1 day', NOW() + INTERVAL '2 days'),
  ('c0000102-0000-0000-0000-000000000102', '11111111-1111-1111-1111-111111111111', 'a0000102-0000-0000-0000-000000000102', 'b0000102-0000-0000-0000-000000000102', 'active', '2045', 'stay_token_azure_102', NOW() - INTERVAL '2 days', NOW() + INTERVAL '1 day'),
  ('c0000204-0000-0000-0000-000000000204', '11111111-1111-1111-1111-111111111111', 'a0000204-0000-0000-0000-000000000204', 'b0000204-0000-0000-0000-000000000204', 'active', '2041', 'stay_token_azure_204', NOW(), NOW() + INTERVAL '3 days'),
  ('c0000304-0000-0000-0000-000000000304', '11111111-1111-1111-1111-111111111111', 'a0000304-0000-0000-0000-000000000304', 'b0000304-0000-0000-0000-000000000304', 'active', '3041', 'stay_token_azure_304', NOW() - INTERVAL '12 hours', NOW() + INTERVAL '4 days')
ON CONFLICT (id) DO NOTHING;

-- E. Insert Invoices for active stays
INSERT INTO invoices (id, hotel_id, stay_id, invoice_number, subtotal_paise, tax_paise, service_charge_paise, total_paise, status)
VALUES
  ('d0000101-0000-0000-0000-000000000101', '11111111-1111-1111-1111-111111111111', 'c0000101-0000-0000-0000-000000000101', 'INV-2026-AZURE-101', 345000, 62100, 17250, 424350, 'draft'),
  ('d0000304-0000-0000-0000-000000000304', '11111111-1111-1111-1111-111111111111', 'c0000304-0000-0000-0000-000000000304', 'INV-2026-AZURE-304', 680000, 122400, 34000, 836400, 'draft')
ON CONFLICT (id) DO NOTHING;

-- F. Menu Categories
INSERT INTO menu_categories (id, hotel_id, name, description, sort_order)
VALUES
  ('e0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Signature Starters', 'Chef curated artisanal appetizers', 1),
  ('e0000002-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Mains & Clay Oven', 'Slow-cooked royal biryanis, curries & grill', 2),
  ('e0000003-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Artisanal Desserts & Sips', 'Sweet indulgences & botanical coolers', 3)
ON CONFLICT (id) DO NOTHING;

-- G. Menu Items
INSERT INTO menu_items (id, hotel_id, category_id, name, description, price_paise, image_url, is_veg)
VALUES
  ('f0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'e0000001-0000-0000-0000-000000000001', 'Truffle & Saffron Paneer Tikka', 'Aged cottage cheese infused with Kashmiri saffron & black summer truffle oil', 95000, 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&auto=format&fit=crop&q=60', true),
  ('f0000002-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'e0000001-0000-0000-0000-000000000001', 'Coastal Butter Garlic Jumbo Prawns', 'Bay of Bengal tiger prawns tossed in churned sea-salt butter, fresh cilantro and charred garlic', 145000, 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=500&auto=format&fit=crop&q=60', false),
  ('f0000003-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'e0000002-0000-0000-0000-000000000002', 'Dum Pukht Awadhi Biryani', 'Fragrant aged Basmati rice layered with spiced meat, rose petals & saffron in a sealed clay handi', 125000, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=60', false),
  ('f0000004-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'e0000002-0000-0000-0000-000000000002', 'Dal Grand Azure (36-Hour Simmer)', 'Slow simmered black lentils on charcoal fire with cultured butter and sun-ripened tomatoes', 75000, 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=60', true),
  ('f0000005-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'e0000003-0000-0000-0000-000000000003', 'Valrhona Dark Chocolate Fondant', 'Molten 70% French dark chocolate dome with Tahitian vanilla bean gelato', 65000, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=60', true)
ON CONFLICT (id) DO NOTHING;

-- H. Initial Orders
INSERT INTO orders (id, hotel_id, stay_id, room_id, order_number, status, items, subtotal_paise, tax_paise, service_charge_paise, total_paise, special_instructions)
VALUES
  ('a1000101-0000-0000-0000-000000000101', '11111111-1111-1111-1111-111111111111', 'c0000101-0000-0000-0000-000000000101', 'a0000101-0000-0000-0000-000000000101', 'ORD-101-92', 'preparing',
   '[{"itemName": "Truffle & Saffron Paneer Tikka", "quantity": 1, "unitPricePaise": 95000, "totalPricePaise": 95000}, {"itemName": "Dal Grand Azure (36-Hour Simmer)", "quantity": 2, "unitPricePaise": 75000, "totalPricePaise": 150000}]'::jsonb,
   245000, 44100, 12250, 301350, 'Serve piping hot with fresh garlic naans'),
  ('a1000102-0000-0000-0000-000000000102', '11111111-1111-1111-1111-111111111111', 'c0000102-0000-0000-0000-000000000102', 'a0000102-0000-0000-0000-000000000102', 'ORD-102-44', 'accepted',
   '[{"itemName": "Coastal Butter Garlic Jumbo Prawns", "quantity": 1, "unitPricePaise": 145000, "totalPricePaise": 145000}]'::jsonb,
   145000, 26100, 7250, 178350, 'Extra lemon wedges please')
ON CONFLICT (id) DO NOTHING;

-- I. Initial Service Requests
INSERT INTO service_requests (id, hotel_id, stay_id, room_id, category, title, details, status, priority, sla_minutes)
VALUES
  ('b1000101-0000-0000-0000-000000000101', '11111111-1111-1111-1111-111111111111', 'c0000101-0000-0000-0000-000000000101', 'a0000101-0000-0000-0000-000000000101', 'housekeeping', 'Turn-down Service & Lavender Pillow Mist', 'Guest requested evening turn-down service', 'in_progress', 'high', 10),
  ('b1000204-0000-0000-0000-000000000204', '11111111-1111-1111-1111-111111111111', 'c0000204-0000-0000-0000-000000000204', 'a0000204-0000-0000-0000-000000000204', 'amenities', 'Champagne Bucket & Coconut Water', 'Overwater villa anniversary celebration', 'created', 'urgent', 8)
ON CONFLICT (id) DO NOTHING;

-- J. Initial Audit Logs
INSERT INTO audit_logs (hotel_id, actor_id, actor_role, action, target_resource, details)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'system', 'platform_admin', 'SCHEMA_INITIALIZED', 'database', '{"schema_version": "2.0.0", "multi_tenant": true}'::jsonb),
  ('11111111-1111-1111-1111-111111111111', 'guest', 'guest', 'BEDSIDE_PIN_VERIFIED', 'stay:c0000101-0000-0000-0000-000000000101', '{"room": "Room 101", "pin": "1014"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Verification query
SELECT 'SCHEMA CREATED AND POPULATED SUCCESSFULLY!' AS status,
       (SELECT COUNT(*) FROM hotels) AS hotels_count,
       (SELECT COUNT(*) FROM rooms) AS rooms_count,
       (SELECT COUNT(*) FROM stays) AS stays_count,
       (SELECT COUNT(*) FROM menu_items) AS menu_items_count;
