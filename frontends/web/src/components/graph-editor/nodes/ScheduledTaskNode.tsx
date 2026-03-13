/**
 * ScheduledTaskNode Component
 * Custom node for ScheduledTask mind type
 * **Validates: Requirements 1.1, 1.9**
 */

import { memo } from 'react';
import { type NodeProps } from 'reactflow';
import { BaseNode, type BaseNodeData } from './BaseNode';

const SCHEDULED_TASK_COLOR = '#0891b2'; // Cyan
const SCHEDULED_TASK_ICON = '⏰';

export const ScheduledTaskNode = memo((props: NodeProps<BaseNodeData>) => {
  return <BaseNode {...props} color={SCHEDULED_TASK_COLOR} icon={SCHEDULED_TASK_ICON} />;
});

ScheduledTaskNode.displayName = 'ScheduledTaskNode';
