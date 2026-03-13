/**
 * CompanyNode Component
 * Custom node for Company mind type
 * **Validates: Requirements 1.1, 1.9**
 */

import { memo } from 'react';
import { type NodeProps } from 'reactflow';
import { BaseNode, type BaseNodeData } from './BaseNode';

const COMPANY_COLOR = '#8b5cf6'; // Purple
const COMPANY_ICON = '🏢';

export const CompanyNode = memo((props: NodeProps<BaseNodeData>) => {
  return <BaseNode {...props} color={COMPANY_COLOR} icon={COMPANY_ICON} />;
});

CompanyNode.displayName = 'CompanyNode';
