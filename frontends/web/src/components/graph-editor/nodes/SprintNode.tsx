/**
 * SprintNode Component
 * Custom node for Sprint mind type
 * **Validates: Requirements 1.1, 1.9, 9.1**
 */

import { memo } from 'react';
import type { NodeProps } from '@reactflow/core';
import { BaseNode, type BaseNodeData } from './BaseNode';

const SPRINT_COLOR = '#8b5cf6'; // Purple
const SPRINT_ICON = '🏃';

export const SprintNode = memo((props: NodeProps<BaseNodeData>) => {
  return <BaseNode {...props} color={SPRINT_COLOR} icon={SPRINT_ICON} />;
});

SprintNode.displayName = 'SprintNode';
