// tests/unit/statemachines.test.ts
// Unit tests for state machine transition rules and rejection of illegal states

import { describe, it, expect } from 'vitest';
import {
  validateStayTransition,
  validateOrderTransition,
  validateRequestTransition,
  StateTransitionError,
} from '@/server/state-machines';

describe('ResortBrain State Machines', () => {
  describe('Stay State Machine', () => {
    it('allows legal check-in and checkout transitions', () => {
      expect(validateStayTransition('reserved', 'checked_in')).toBe(true);
      expect(validateStayTransition('checked_in', 'active')).toBe(true);
      expect(validateStayTransition('active', 'checked_out')).toBe(true);
    });

    it('rejects transitioning a checked-out stay', () => {
      expect(() => validateStayTransition('checked_out', 'active')).toThrow(StateTransitionError);
    });
  });

  describe('Order State Machine', () => {
    it('allows full progression: pending -> accepted -> preparing -> ready -> delivered', () => {
      expect(validateOrderTransition('pending', 'accepted')).toBe(true);
      expect(validateOrderTransition('accepted', 'preparing')).toBe(true);
      expect(validateOrderTransition('preparing', 'ready')).toBe(true);
      expect(validateOrderTransition('ready', 'delivered')).toBe(true);
    });

    it('rejects illegal transition backwards from delivered to preparing', () => {
      expect(() => validateOrderTransition('delivered', 'preparing')).toThrow(StateTransitionError);
    });
  });

  describe('Request State Machine', () => {
    it('allows complete lifecycle: created -> acknowledged -> in_progress -> completed', () => {
      expect(validateRequestTransition('created', 'acknowledged')).toBe(true);
      expect(validateRequestTransition('acknowledged', 'in_progress')).toBe(true);
      expect(validateRequestTransition('in_progress', 'completed')).toBe(true);
    });

    it('rejects completing a request twice or skipping acknowledgment', () => {
      expect(() => validateRequestTransition('completed', 'acknowledged')).toThrow(StateTransitionError);
    });
  });
});
