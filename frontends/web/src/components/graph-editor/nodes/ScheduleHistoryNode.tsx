/**
 * ScheduleHistoryNode Component
 * Custom node for ScheduleHistory mind type
 * **Validates: Requirements 1.1, 1.9**
 */

import { memo } from 'react';
import type { NodeProps } from '@reactflow/core';
import { BaseNode, type BaseNodeData } from './BaseNode';

const SCHEDULE_HISTORY_COLOR = '#64748b'; // Slate
const SCHEDULE_HISTORY_ICON = '📊';

export const ScheduleHistoryNode = memo((props: NodeProps<BaseNodeData>) => {
  return <BaseNode {...props} color={SCHEDULE_HISTORY_COLOR} icon={SCHEDULE_HISTORY_ICON} />;
});

ScheduleHistoryNode.displayName = 'ScheduleHistoryNode';
