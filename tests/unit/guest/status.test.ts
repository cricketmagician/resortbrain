import { describe, expect, it } from 'vitest';
import { buildOrderTimeline, buildRequestTimeline, orderStepIndex, requestStepIndex } from '@/lib/guest/status';

describe('orderStepIndex', () => {
  it('orders the happy path', () => {
    expect(orderStepIndex('pending')).toBe(0);
    expect(orderStepIndex('accepted')).toBe(1);
    expect(orderStepIndex('preparing')).toBe(2);
    expect(orderStepIndex('ready')).toBe(3);
    expect(orderStepIndex('delivered')).toBe(4);
  });

  it('returns -1 for a terminal status outside the happy path', () => {
    expect(orderStepIndex('cancelled')).toBe(-1);
  });

  it('lets a caller detect and ignore an out-of-order (older) update', () => {
    const current = orderStepIndex('preparing');
    const incoming = orderStepIndex('accepted');
    expect(incoming).toBeLessThan(current);
  });
});

describe('requestStepIndex', () => {
  it('orders the happy path', () => {
    expect(requestStepIndex('created')).toBe(0);
    expect(requestStepIndex('acknowledged')).toBe(1);
    expect(requestStepIndex('in_progress')).toBe(2);
    expect(requestStepIndex('completed')).toBe(3);
  });

  it('returns -1 for cancelled or rejected', () => {
    expect(requestStepIndex('cancelled')).toBe(-1);
    expect(requestStepIndex('rejected')).toBe(-1);
  });
});

describe('buildOrderTimeline', () => {
  const createdAt = '2026-09-26T14:00:00.000Z';
  const updatedAt = '2026-09-26T14:05:00.000Z';

  it('maps every happy-path status to its full set of steps', () => {
    const timeline = buildOrderTimeline({ status: 'preparing', createdAt, updatedAt });
    expect(timeline.steps.map((s) => s.key)).toEqual(['pending', 'accepted', 'preparing', 'ready', 'delivered']);
    expect(timeline.currentKey).toBe('preparing');
    expect(timeline.steps[0].at).toBe(createdAt);
    expect(timeline.steps[2].at).toBe(updatedAt);
    expect(timeline.steps[1].at).toBeUndefined();
    expect(timeline.steps[3].at).toBeUndefined();
    expect(timeline.terminal).toBeUndefined();
  });

  it('replaces the remaining steps with one terminal row when cancelled', () => {
    const timeline = buildOrderTimeline({ status: 'cancelled', createdAt, updatedAt });
    expect(timeline.currentKey).toBeNull();
    expect(timeline.steps).toHaveLength(1);
    expect(timeline.steps[0].key).toBe('pending');
    expect(timeline.terminal).toMatchObject({ key: 'cancelled', tone: 'danger', at: updatedAt });
  });
});

describe('buildRequestTimeline', () => {
  const createdAt = '2026-09-26T14:00:00.000Z';
  const acknowledgedAt = '2026-09-26T14:02:00.000Z';
  const completedAt = '2026-09-26T14:20:00.000Z';

  it('maps every happy-path status to its full set of steps', () => {
    const timeline = buildRequestTimeline({ status: 'acknowledged', createdAt, acknowledgedAt, completedAt: undefined });
    expect(timeline.steps.map((s) => s.key)).toEqual(['created', 'acknowledged', 'in_progress', 'completed']);
    expect(timeline.currentKey).toBe('acknowledged');
    expect(timeline.steps[0].at).toBe(createdAt);
    expect(timeline.steps[1].at).toBe(acknowledgedAt);
    expect(timeline.steps[2].at).toBeUndefined();
  });

  it('carries completedAt onto the completed step', () => {
    const timeline = buildRequestTimeline({ status: 'completed', createdAt, acknowledgedAt, completedAt });
    expect(timeline.currentKey).toBe('completed');
    expect(timeline.steps[3].at).toBe(completedAt);
  });

  it('replaces the remaining steps with one terminal row when rejected', () => {
    const timeline = buildRequestTimeline({ status: 'rejected', createdAt, acknowledgedAt, completedAt: undefined });
    expect(timeline.currentKey).toBeNull();
    expect(timeline.terminal).toMatchObject({ key: 'rejected', tone: 'danger' });
  });
});
