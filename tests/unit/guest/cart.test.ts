import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryStorage } from './_helpers/memory-storage';

let cart: typeof import('@/lib/guest/cart');

beforeEach(async () => {
  vi.stubGlobal('localStorage', new MemoryStorage());
  vi.resetModules();
  cart = await import('@/lib/guest/cart');
});

function readStored(stayId: string): unknown[] {
  return JSON.parse(localStorage.getItem(`rb.cart.${stayId}`) ?? '[]');
}

describe('addLine', () => {
  it('adds a new line at quantity 1', () => {
    cart.addLine('stay-1', 'item-001');
    expect(readStored('stay-1')).toEqual([{ menuItemId: 'item-001', quantity: 1 }]);
  });

  it('increments an existing line instead of duplicating it', () => {
    cart.addLine('stay-1', 'item-001');
    cart.addLine('stay-1', 'item-001');
    expect(readStored('stay-1')).toEqual([{ menuItemId: 'item-001', quantity: 2 }]);
  });
});

describe('setQuantity', () => {
  it('sets an explicit quantity', () => {
    cart.addLine('stay-1', 'item-001');
    cart.setQuantity('stay-1', 'item-001', 5);
    expect(readStored('stay-1')).toEqual([{ menuItemId: 'item-001', quantity: 5 }]);
  });

  it('removes the line when set to 0', () => {
    cart.addLine('stay-1', 'item-001');
    cart.setQuantity('stay-1', 'item-001', 0);
    expect(readStored('stay-1')).toEqual([]);
  });
});

describe('setNote', () => {
  it('attaches a trimmed note to a line', () => {
    cart.addLine('stay-1', 'item-001');
    cart.setNote('stay-1', 'item-001', '  no chilli  ');
    expect(readStored('stay-1')).toEqual([{ menuItemId: 'item-001', quantity: 1, note: 'no chilli' }]);
  });

  it('clears the note when set to an empty string', () => {
    cart.addLine('stay-1', 'item-001');
    cart.setNote('stay-1', 'item-001', 'extra crispy');
    cart.setNote('stay-1', 'item-001', '   ');
    expect(readStored('stay-1')[0]).not.toHaveProperty('note');
  });
});

describe('clearCart', () => {
  it('empties the stored cart', () => {
    cart.addLine('stay-1', 'item-001');
    cart.clearCart('stay-1');
    expect(readStored('stay-1')).toEqual([]);
  });
});

describe('cartHash', () => {
  it('is stable regardless of line order', () => {
    const a = cart.cartHash([
      { menuItemId: 'b', quantity: 1 },
      { menuItemId: 'a', quantity: 2 },
    ]);
    const b = cart.cartHash([
      { menuItemId: 'a', quantity: 2 },
      { menuItemId: 'b', quantity: 1 },
    ]);
    expect(a).toBe(b);
  });

  it('changes when a quantity changes', () => {
    const base = cart.cartHash([{ menuItemId: 'a', quantity: 1 }]);
    expect(cart.cartHash([{ menuItemId: 'a', quantity: 2 }])).not.toBe(base);
  });

  it('changes when a note changes', () => {
    const base = cart.cartHash([{ menuItemId: 'a', quantity: 1 }]);
    expect(cart.cartHash([{ menuItemId: 'a', quantity: 1, note: 'no chilli' }])).not.toBe(base);
  });
});

describe('the persisted cart', () => {
  it('never stores a price field — only ids, quantities and notes', () => {
    cart.addLine('stay-1', 'item-001');
    cart.setNote('stay-1', 'item-001', 'extra spicy');
    const raw = localStorage.getItem('rb.cart.stay-1')!;
    expect(raw.toLowerCase()).not.toMatch(/price/);
    for (const line of readStored('stay-1') as Record<string, unknown>[]) {
      expect(Object.keys(line).sort()).toEqual(['menuItemId', 'note', 'quantity']);
    }
  });
});
