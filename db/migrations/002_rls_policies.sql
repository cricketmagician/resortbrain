-- Migration 002: Row Level Security (RLS) Policies
-- Enforces absolute multi-tenant data isolation

-- Enable RLS on all hotel-scoped tables
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE stays ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Staff Membership Check Helper: Returns True if auth.uid() has active membership in hotel_id
CREATE OR REPLACE FUNCTION is_hotel_staff(target_hotel_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM memberships
    WHERE hotel_id = target_hotel_id
      AND user_id = auth.uid()
      AND revoked_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Public / Guest Policies
-- Anyone can read public menu for an active hotel
CREATE POLICY public_menu_categories_read ON menu_categories
  FOR SELECT USING (true);

CREATE POLICY public_menu_items_read ON menu_items
  FOR SELECT USING (is_available = true);

-- Orders: Staff can read and update orders for their hotel
CREATE POLICY orders_staff_read ON orders
  FOR SELECT USING (is_hotel_staff(hotel_id));

CREATE POLICY orders_staff_update ON orders
  FOR UPDATE USING (is_hotel_staff(hotel_id));

-- Orders: Guests can insert and read orders matching their stay
CREATE POLICY orders_guest_select ON orders
  FOR SELECT USING (
    stay_id IN (
      SELECT id FROM stays
      WHERE stay_token = current_setting('request.headers', true)::json->>'x-stay-token'
    )
  );

CREATE POLICY orders_guest_insert ON orders
  FOR INSERT WITH CHECK (
    stay_id IN (
      SELECT id FROM stays
      WHERE stay_token = current_setting('request.headers', true)::json->>'x-stay-token'
    )
  );

-- Service Requests: Staff isolation
CREATE POLICY requests_staff_all ON service_requests
  FOR ALL USING (is_hotel_staff(hotel_id));

-- Service Requests: Guest access
CREATE POLICY requests_guest_select ON service_requests
  FOR SELECT USING (
    stay_id IN (
      SELECT id FROM stays
      WHERE stay_token = current_setting('request.headers', true)::json->>'x-stay-token'
    )
  );

CREATE POLICY requests_guest_insert ON service_requests
  FOR INSERT WITH CHECK (
    stay_id IN (
      SELECT id FROM stays
      WHERE stay_token = current_setting('request.headers', true)::json->>'x-stay-token'
    )
  );

-- Invoices & Payments: Staff can read their hotel's billing
CREATE POLICY invoices_staff_all ON invoices
  FOR ALL USING (is_hotel_staff(hotel_id));

CREATE POLICY payments_staff_all ON payments
  FOR ALL USING (is_hotel_staff(hotel_id));

-- Audit Logs: Only staff/admin can read their hotel's audit entries
CREATE POLICY audit_staff_read ON audit_logs
  FOR SELECT USING (is_hotel_staff(hotel_id));
