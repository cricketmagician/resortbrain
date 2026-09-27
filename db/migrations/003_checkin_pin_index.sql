-- Migration 003: Index the guest check-in PIN lookup
--
-- /api/stays/verify looks up stays by `.eq('checkin_pin', pin).eq('status', 'active')`
-- on every guest self-check-in (see app/api/stays/verify/route.ts). The stays table
-- has indexes on stay_token and its primary key, but none on checkin_pin, so this
-- hot-path lookup was a full table scan. Partial index scoped to active stays keeps
-- it small since checked-out/cancelled stays never match this query anyway.

CREATE INDEX IF NOT EXISTS idx_stays_checkin_pin_active
  ON stays(checkin_pin)
  WHERE status = 'active';
