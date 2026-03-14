/**
 * FailureNode Component
 * Custom node for Failure mind type
 * **Validates: Requirements 1.1, 1.9**
 */

import { memo } from 'react';
import type { NodeProps } from '@reactflow/core';
import { BaseNode, type BaseNodeData } from './BaseNode';

const FAILURE_COLOR = '#dc2626'; // Dark Red
const FAILURE_ICON = '❌';

export const FailureNode = memo((props: NodeProps<BaseNodeData>) => {
  return <BaseNode {...props} color={FAILURE_COLOR} icon={FAILURE_ICON} />;
});

FailureNode.displayName = 'FailureNode';
