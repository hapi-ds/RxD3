/**
 * KnowledgeNode Component
 * Custom node for Knowledge mind type
 * **Validates: Requirements 1.1, 1.9**
 */

import { memo } from 'react';
import { type NodeProps } from 'reactflow';
import { BaseNode, type BaseNodeData } from './BaseNode';

const KNOWLEDGE_COLOR = '#ec4899'; // Pink
const KNOWLEDGE_ICON = '💡';

export const KnowledgeNode = memo((props: NodeProps<BaseNodeData>) => {
  return <BaseNode {...props} color={KNOWLEDGE_COLOR} icon={KNOWLEDGE_ICON} />;
});

KnowledgeNode.displayName = 'KnowledgeNode';
