-- Migration 001: Initial Schema for ResortBrain Hotel SaaS Platform
-- Modular monolith schema with multi-tenant design

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tenant & SaaS Plane
CREATE TABLE IF NOT EXISTS plans (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  max_rooms INT NOT NULL,
  max_staff INT NOT NULL,
  price_paise BIGINT NOT NULL,
  billing_period VARCHAR(32) DEFAULT 'monthly',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hotels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  tagline VARCHAR(255),
  logo_url TEXT,
  banner_url TEXT,
  currency VARCHAR(8) DEFAULT 'INR',
  tax_rate_percent NUMERIC(5, 2) DEFAULT 18.00, -- e.g., 18% GST
  service_charge_percent NUMERIC(5, 2) DEFAULT 5.00,
  plan_id VARCHAR(64) REFERENCES plans(id),
  status VARCHAR(32) DEFAULT 'active', -- active, suspended, trial
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  key VARCHAR(64) NOT NULL,
  enabled BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}'::jsonb,
  UNIQUE(hotel_id, key)
);

CREATE TABLE IF NOT EXISTS usage_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  metric VARCHAR(64) NOT NULL,
  count BIGINT DEFAULT 0,
  period VARCHAR(32) NOT NULL, -- e.g., 2026-09
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Identity & Access Management (Staff & Admin)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY, -- matches auth.uid()
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(32),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(32) NOT NULL, -- 'platform_admin', 'hotel_manager', 'front_desk', 'kitchen_chef', 'housekeeping'
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hotel_id, user_id)
);

CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL,
  invited_by UUID REFERENCES profiles(id),
  token VARCHAR(128) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Rooms and Stays
CREATE TABLE IF NOT EXISTS floors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  floor_number INT NOT NULL,
  name VARCHAR(64),
  UNIQUE(hotel_id, floor_number)
);

CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  floor_id UUID REFERENCES floors(id),
  room_number VARCHAR(32) NOT NULL,
  room_type VARCHAR(64) NOT NULL, -- 'Deluxe Villa', 'Royal Suite', etc.
  status VARCHAR(32) DEFAULT 'available', -- 'available', 'reserved', 'occupied', 'cleaning', 'inspected', 'maintenance'
  qr_code_token VARCHAR(128) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hotel_id, room_number)
);

CREATE TABLE IF NOT EXISTS guests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(32),
  email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id),
  guest_id UUID NOT NULL REFERENCES guests(id),
  status VARCHAR(32) DEFAULT 'active', -- 'reserved', 'checked_in', 'active', 'checked_out', 'cancelled'
  check_in TIMESTAMPTZ NOT NULL,
  check_out TIMESTAMPTZ NOT NULL,
  stay_token VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Menu & Food/Beverage Catalog
CREATE TABLE IF NOT EXISTS menu_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name VARCHAR(128) NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  icon VARCHAR(64)
);

CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price_paise BIGINT NOT NULL, -- integer minor units (paise)
  image_url TEXT,
  is_veg BOOLEAN DEFAULT true,
  allergen_tags TEXT[] DEFAULT '{}',
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Operations & Service Requests
CREATE TABLE IF NOT EXISTS service_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  stay_id UUID NOT NULL REFERENCES stays(id),
  room_id UUID NOT NULL REFERENCES rooms(id),
  category VARCHAR(64) NOT NULL, -- 'housekeeping', 'amenities', 'front_desk', 'maintenance'
  title VARCHAR(255) NOT NULL,
  details TEXT,
  status VARCHAR(32) DEFAULT 'created', -- 'created', 'acknowledged', 'in_progress', 'completed', 'cancelled'
  priority VARCHAR(32) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  sla_minutes INT DEFAULT 15,
  escalation_sent BOOLEAN DEFAULT false,
  assigned_to UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS request_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  from_status VARCHAR(32),
  to_status VARCHAR(32) NOT NULL,
  actor_id UUID,
  actor_role VARCHAR(32),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Commerce, Dining Orders & Billing
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  stay_id UUID NOT NULL REFERENCES stays(id),
  room_id UUID NOT NULL REFERENCES rooms(id),
  order_number VARCHAR(32) NOT NULL,
  status VARCHAR(32) DEFAULT 'pending', -- 'pending', 'accepted', 'preparing', 'ready', 'delivered', 'cancelled'
  subtotal_paise BIGINT NOT NULL,
  tax_paise BIGINT NOT NULL,
  service_charge_paise BIGINT NOT NULL,
  total_paise BIGINT NOT NULL,
  special_instructions TEXT,
  idempotency_key VARCHAR(128) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id),
  item_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price_paise BIGINT NOT NULL,
  total_price_paise BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  stay_id UUID NOT NULL REFERENCES stays(id),
  invoice_number VARCHAR(64) UNIQUE NOT NULL,
  subtotal_paise BIGINT NOT NULL,
  tax_paise BIGINT NOT NULL,
  discount_paise BIGINT DEFAULT 0,
  total_paise BIGINT NOT NULL,
  status VARCHAR(32) DEFAULT 'draft', -- 'draft', 'issued', 'partially_paid', 'paid', 'voided', 'refunded'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  amount_paise BIGINT NOT NULL,
  payment_method VARCHAR(64) DEFAULT 'card_test', -- 'card_test', 'upi_test', 'room_charge'
  status VARCHAR(32) DEFAULT 'succeeded', -- 'pending', 'succeeded', 'failed'
  transaction_ref VARCHAR(128) UNIQUE,
  idempotency_key VARCHAR(128) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Platform Safety, Audit, Outbox & Push Notifications
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE SET NULL,
  actor_id UUID,
  actor_role VARCHAR(64),
  action VARCHAR(128) NOT NULL,
  target_resource VARCHAR(128) NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  trace_id VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS outbox_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  event_type VARCHAR(128) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(32) DEFAULT 'queued', -- 'queued', 'processing', 'delivered', 'failed'
  attempts INT DEFAULT 0,
  next_retry_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  device_name VARCHAR(128),
  department VARCHAR(64), -- 'kitchen', 'front_desk', 'housekeeping', 'manager'
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for high-speed p95 query performance
CREATE INDEX IF NOT EXISTS idx_orders_hotel_status ON orders(hotel_id, status);
CREATE INDEX IF NOT EXISTS idx_requests_hotel_status ON service_requests(hotel_id, status);
CREATE INDEX IF NOT EXISTS idx_stays_token ON stays(stay_token);
CREATE INDEX IF NOT EXISTS idx_rooms_qr ON rooms(qr_code_token);
CREATE INDEX IF NOT EXISTS idx_outbox_status_retry ON outbox_events(status, next_retry_at);
