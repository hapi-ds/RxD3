/**
 * JournalentryNode Component
 * Custom node for Journalentry mind type
 * **Validates: Requirements 1.1, 1.9**
 */

import { memo } from 'react';
import { type NodeProps } from 'reactflow';
import { BaseNode, type BaseNodeData } from './BaseNode';

const JOURNALENTRY_COLOR = '#a855f7'; // Purple
const JOURNALENTRY_ICON = '📝';

export const JournalentryNode = memo((props: NodeProps<BaseNodeData>) => {
  return <BaseNode {...props} color={JOURNALENTRY_COLOR} icon={JOURNALENTRY_ICON} />;
});

JournalentryNode.displayName = 'JournalentryNode';
