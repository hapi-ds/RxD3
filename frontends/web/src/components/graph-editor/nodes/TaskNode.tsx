/**
 * TaskNode Component
 * Custom node for Task mind type
 * **Validates: Requirements 1.1, 1.9**
 */

import { memo } from 'react';
import type { NodeProps } from '@reactflow/core';
import { BaseNode, type BaseNodeData } from './BaseNode';

const TASK_COLOR = '#10b981'; // Green
const TASK_ICON = '✓';

export const TaskNode = memo((props: NodeProps<BaseNodeData>) => {
  return <BaseNode {...props} color={TASK_COLOR} icon={TASK_ICON} />;
});

TaskNode.displayName = 'TaskNode';
