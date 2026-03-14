/**
 * RequirementNode Component
 * Custom node for Requirement mind type
 * **Validates: Requirements 1.1, 1.9**
 */

import { memo } from 'react';
import type { NodeProps } from '@reactflow/core';
import { BaseNode, type BaseNodeData } from './BaseNode';

const REQUIREMENT_COLOR = '#6366f1'; // Indigo
const REQUIREMENT_ICON = '📋';

export const RequirementNode = memo((props: NodeProps<BaseNodeData>) => {
  return <BaseNode {...props} color={REQUIREMENT_COLOR} icon={REQUIREMENT_ICON} />;
});

RequirementNode.displayName = 'RequirementNode';
