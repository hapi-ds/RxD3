/**
 * AcceptanceCriteriaNode Component
 * Custom node for AcceptanceCriteria mind type
 * **Validates: Requirements 1.1, 1.9**
 */

import { memo } from 'react';
import type { NodeProps } from '@reactflow/core';
import { BaseNode, type BaseNodeData } from './BaseNode';

const ACCEPTANCE_CRITERIA_COLOR = '#14b8a6'; // Teal
const ACCEPTANCE_CRITERIA_ICON = '✔️';

export const AcceptanceCriteriaNode = memo((props: NodeProps<BaseNodeData>) => {
  return <BaseNode {...props} color={ACCEPTANCE_CRITERIA_COLOR} icon={ACCEPTANCE_CRITERIA_ICON} />;
});

AcceptanceCriteriaNode.displayName = 'AcceptanceCriteriaNode';
