# Operations & Deployment Runbook

## Environments
| Env | Source | Database | Purpose |
|-----|--------|----------|---------|
| Local | Working branch | Local Postgres / Supabase CLI | Development |
| Staging | `main` (auto-deploy) | Supabase Staging | Team Integration Hour, E2E tests, load tests |
| Production | Release tag | Supabase Production | Conclave Live Demo & Judge Phones |

---

## Step-by-Step Deployment Guide
1. **Supabase Projects Setup**:
   - Create Staging and Production projects on Supabase.
   - Run SQL migration scripts from `db/migrations/` sequentially.
2. **Environment Variables Configuration (Vercel & Local)**:
   - `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (strictly server-side)
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` & `VAPID_PRIVATE_KEY`: Web push encryption keys
   - `PAYMENT_GATEWAY_TEST_KEY`: Test mode secret key
3. **Seed Data Execution**:
   - Run `npm run seed` to populate:
     - 2 distinct hotels: "Grand Azure Resort & Spa" (Hotel A) and "The Heritage Palace" (Hotel B)
     - Staff members for each role (manager, kitchen chef, front desk, housekeeping)
     - Menu items with high-res photography, modifier sets, pricing in minor units
     - Active room stays with pre-generated QR codes
4. **Verification & Health Check**:
   - Check `/api/health` - verifies DB connectivity, active tenant counts, and push readiness.
   - Verify QR codes on real phones.
   - Verify cross-tenant isolation (Hotel A staff cannot access Hotel B orders).

---

## Rollback & Emergency Procedures
- **Vercel Rollback**: Instant 1-click rollback to prior deployment hash from Vercel dashboard.
- **Database Snapshot Restore**: Re-run `npm run seed` to restore clean demo state in 5 seconds if test data gets dirty during demo rehearsals.
- **Push Fallback**: If browser push permission is denied at venue, the staff workspace operates with Supabase Realtime fallback and audible chime alerts.
