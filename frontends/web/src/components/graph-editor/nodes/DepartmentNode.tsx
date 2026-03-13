/**
 * DepartmentNode Component
 * Custom node for Department mind type
 * **Validates: Requirements 1.1, 1.9**
 */

import { memo } from 'react';
import { type NodeProps } from 'reactflow';
import { BaseNode, type BaseNodeData } from './BaseNode';

const DEPARTMENT_COLOR = '#06b6d4'; // Cyan
const DEPARTMENT_ICON = '🏛️';

export const DepartmentNode = memo((props: NodeProps<BaseNodeData>) => {
  return <BaseNode {...props} color={DEPARTMENT_COLOR} icon={DEPARTMENT_ICON} />;
});

DepartmentNode.displayName = 'DepartmentNode';
