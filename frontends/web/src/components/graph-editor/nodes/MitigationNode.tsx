/**
 * MitigationNode Component
 * Custom node for Mitigation mind type
 * **Validates: Requirements 1.1, 1.9**
 */

import { memo } from 'react';
import type { NodeProps } from '@reactflow/core';
import { BaseNode, type BaseNodeData } from './BaseNode';

const MITIGATION_COLOR = '#f43f5e'; // Rose
const MITIGATION_ICON = '🛡️';

export const MitigationNode = memo((props: NodeProps<BaseNodeData>) => {
  return <BaseNode {...props} color={MITIGATION_COLOR} icon={MITIGATION_ICON} />;
});

MitigationNode.displayName = 'MitigationNode';
