/**
 * ProjectNode Component
 * Custom node for Project mind type
 * **Validates: Requirements 1.1, 1.9**
 */

import { memo } from 'react';
import { type NodeProps } from 'reactflow';
import { BaseNode, type BaseNodeData } from './BaseNode';

const PROJECT_COLOR = '#3b82f6'; // Blue
const PROJECT_ICON = '📁';

export const ProjectNode = memo((props: NodeProps<BaseNodeData>) => {
  return <BaseNode {...props} color={PROJECT_COLOR} icon={PROJECT_ICON} />;
});

ProjectNode.displayName = 'ProjectNode';
