/**
 * Custom Node Components Tests
 * Tests for custom node components and nodeTypes configuration
 * 
 * **Validates: Requirements 1.1, 1.9**
 */

import { describe, it, expect } from 'vitest';
import { nodeTypes, nodeColors } from './index';

describe('Custom Node Components', () => {
  describe('nodeTypes configuration', () => {
    it('should have all 16 mind types registered', () => {
      const expectedTypes = [
        'Project',
        'Task',
        'Company',
        'Department',
        'Email',
        'Knowledge',
        'AcceptanceCriteria',
        'Risk',
        'Failure',
        'Requirement',
        'Resource',
        'Journalentry',
        'Booking',
        'Account',
        'ScheduleHistory',
        'ScheduledTask',
      ];

      expectedTypes.forEach((type) => {
        expect(nodeTypes[type]).toBeDefined();
        // React components wrapped with memo are objects, not functions
        expect(nodeTypes[type]).toBeTruthy();
      });
    });

    it('should have exactly 16 node types', () => {
      expect(Object.keys(nodeTypes)).toHaveLength(16);
    });
  });

  describe('nodeColors configuration', () => {
    it('should have colors for all 16 mind types', () => {
      const expectedTypes = [
        'Project',
        'Task',
        'Company',
        'Department',
        'Email',
        'Knowledge',
        'AcceptanceCriteria',
        'Risk',
        'Failure',
        'Requirement',
        'Resource',
        'Journalentry',
        'Booking',
        'Account',
        'ScheduleHistory',
        'ScheduledTask',
      ];

      expectedTypes.forEach((type) => {
        expect(nodeColors[type]).toBeDefined();
        expect(nodeColors[type]).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });

    it('should have distinct colors for different node types', () => {
      const colors = Object.values(nodeColors);
      const uniqueColors = new Set(colors);
      
      // All colors should be unique
      expect(uniqueColors.size).toBe(colors.length);
    });

    it('should use valid hex color format', () => {
      Object.values(nodeColors).forEach((color) => {
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });
  });

  describe('node type and color consistency', () => {
    it('should have matching keys in nodeTypes and nodeColors', () => {
      const typeKeys = Object.keys(nodeTypes).sort();
      const colorKeys = Object.keys(nodeColors).sort();
      
      expect(typeKeys).toEqual(colorKeys);
    });
  });
});
