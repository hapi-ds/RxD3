/**
 * RiskNode Component
 * Custom node for Risk mind type
 * **Validates: Requirements 1.1, 1.9**
 */

import { memo } from 'react';
import { type NodeProps } from 'reactflow';
import { BaseNode, type BaseNodeData } from './BaseNode';

const RISK_COLOR = '#ef4444'; // Red
const RISK_ICON = '⚠️';

export const RiskNode = memo((props: NodeProps<BaseNodeData>) => {
  return <BaseNode {...props} color={RISK_COLOR} icon={RISK_ICON} />;
});

RiskNode.displayName = 'RiskNode';
