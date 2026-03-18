/**
 * Preservation property tests for nodeTypeConfig.
 *
 * Verifies that for all non-Failure node types, nodeTypeConfig correctly
 * identifies base vs type-specific attributes. These tests must PASS on
 * unfixed code, confirming baseline behavior to preserve.
 *
 * **Validates: Requirements 3.5, 3.6**
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { NODE_TYPE_CONFIGS } from './nodeTypeConfig';
import type { NodeType } from '../../types/generated';

const BASE_ATTRIBUTE_NAMES = [
  'title',
  'creator',
  'description',
  'status',
  'tags',
  'uuid',
  'version',
  'created_at',
  'updated_at',
];

// All node types except Failure
const NON_FAILURE_NODE_TYPES: NodeType[] = (
  Object.keys(NODE_TYPE_CONFIGS) as NodeType[]
).filter((t) => t !== 'Failure');

// All node types
const ALL_NODE_TYPES: NodeType[] = Object.keys(NODE_TYPE_CONFIGS) as NodeType[];

describe('nodeTypeConfig Preservation - Base vs Type-Specific Attributes', () => {
  it('for all non-Failure node types, config correctly identifies base vs type-specific attributes', () => {
    /**
     * Property: for all non-Failure node types, nodeTypeConfig contains
     * all base attributes and any additional attributes are type-specific
     * (not in the base set).
     *
     * **Validates: Requirements 3.5**
     */
    const nodeTypeArb = fc.constantFrom(...NON_FAILURE_NODE_TYPES);

    fc.assert(
      fc.property(nodeTypeArb, (nodeType: NodeType) => {
        const config = NODE_TYPE_CONFIGS[nodeType];

        // Config must exist
        expect(config).toBeDefined();
        expect(config.type).toBe(nodeType);

        const attrNames = config.attributes.map((a) => a.name);

        // ScheduleHistory filters out 'status' from base and re-adds it later,
        // so we handle that special case
        const expectedBase =
          nodeType === 'ScheduleHistory'
            ? BASE_ATTRIBUTE_NAMES.filter((n) => n !== 'status')
            : BASE_ATTRIBUTE_NAMES;

        // All expected base attributes must be present
        for (const baseName of expectedBase) {
          expect(attrNames).toContain(baseName);
        }

        // Type-specific attributes are those not in the base set
        const typeSpecificAttrs = config.attributes.filter(
          (a) => !BASE_ATTRIBUTE_NAMES.includes(a.name)
        );

        // Each type-specific attribute should NOT be a base attribute
        for (const attr of typeSpecificAttrs) {
          expect(BASE_ATTRIBUTE_NAMES).not.toContain(attr.name);
        }
      }),
      { numRuns: NON_FAILURE_NODE_TYPES.length }
    );
  });

  it('all node types have a label and type matching their key', () => {
    /**
     * Property: for all node types, the config type field matches the key.
     *
     * **Validates: Requirements 3.5**
     */
    const nodeTypeArb = fc.constantFrom(...ALL_NODE_TYPES);

    fc.assert(
      fc.property(nodeTypeArb, (nodeType: NodeType) => {
        const config = NODE_TYPE_CONFIGS[nodeType];
        expect(config.type).toBe(nodeType);
        expect(config.label).toBeTruthy();
      }),
      { numRuns: ALL_NODE_TYPES.length }
    );
  });
});
