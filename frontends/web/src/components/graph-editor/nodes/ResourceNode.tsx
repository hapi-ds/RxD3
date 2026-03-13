/**
 * ResourceNode Component
 * Custom node for Resource mind type
 * **Validates: Requirements 1.1, 1.9**
 */

import { memo } from 'react';
import { type NodeProps } from 'reactflow';
import { BaseNode, type BaseNodeData } from './BaseNode';

const RESOURCE_COLOR = '#65a30d'; // Darker Lime (WCAG AA compliant: 3.45:1 contrast with white)
const RESOURCE_ICON = '👤';

export const ResourceNode = memo((props: NodeProps<BaseNodeData>) => {
  return <BaseNode {...props} color={RESOURCE_COLOR} icon={RESOURCE_ICON} />;
});

ResourceNode.displayName = 'ResourceNode';
