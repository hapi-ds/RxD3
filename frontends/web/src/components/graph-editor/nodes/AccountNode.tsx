/**
 * AccountNode Component
 * Custom node for Account mind type
 * **Validates: Requirements 1.1, 1.9**
 */

import { memo } from 'react';
import { type NodeProps } from 'reactflow';
import { BaseNode, type BaseNodeData } from './BaseNode';

const ACCOUNT_COLOR = '#059669'; // Emerald
const ACCOUNT_ICON = '💰';

export const AccountNode = memo((props: NodeProps<BaseNodeData>) => {
  return <BaseNode {...props} color={ACCOUNT_COLOR} icon={ACCOUNT_ICON} />;
});

AccountNode.displayName = 'AccountNode';
