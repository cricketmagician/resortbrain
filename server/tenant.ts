// server/tenant.ts
// Unified Multi-Tenant Resolution for ResortBrain
// Resolves seamlessly across Supabase UUIDs, local IDs, and URL slugs

export interface TenantInfo {
  id: string; // Local ID e.g. 'hotel-001'
  uuid: string; // Supabase UUID e.g. '11111111-1111-1111-1111-111111111111'
  slug: string; // URL slug e.g. 'grand-azure'
  name: string;
}

export const KNOWN_TENANTS: TenantInfo[] = [
  {
    id: 'hotel-001',
    uuid: '11111111-1111-1111-1111-111111111111',
    slug: 'grand-azure',
    name: 'Grand Azure Resort & Spa',
  },
  {
    id: 'hotel-002',
    uuid: '22222222-2222-2222-2222-222222222222',
    slug: 'the-heritage-palace',
    name: 'The Heritage Palace & Fort',
  },
  {
    id: 'hotel-003',
    uuid: '33333333-3333-3333-3333-333333333333',
    slug: 'the-leela-palace',
    name: 'The Leela Palace Resort & Spa',
  },
];

export function resolveTenant(identifier?: string | null): TenantInfo {
  if (!identifier) return KNOWN_TENANTS[0];

  const clean = identifier.trim().toLowerCase();

  const found = KNOWN_TENANTS.find(
    (t) =>
      t.id.toLowerCase() === clean ||
      t.uuid.toLowerCase() === clean ||
      t.slug.toLowerCase() === clean ||
      clean.includes(t.slug.toLowerCase()) ||
      t.name.toLowerCase().includes(clean)
  );

  if (found) return found;

  return {
    id: identifier,
    uuid: identifier,
    slug: clean.replace(/[^a-z0-9]+/g, '-'),
    name: identifier,
  };
}

export function isSameTenant(idA?: string | null, idB?: string | null): boolean {
  if (!idA || !idB) return false;
  if (idA === idB) return true;
  const tA = resolveTenant(idA);
  const tB = resolveTenant(idB);
  return tA.id === tB.id || tA.uuid === tB.uuid || tA.slug === tB.slug;
}
