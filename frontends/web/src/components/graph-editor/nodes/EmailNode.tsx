/**
 * EmailNode Component
 * Custom node for Email mind type
 * **Validates: Requirements 1.1, 1.9**
 */

import { memo } from 'react';
import type { NodeProps } from '@reactflow/core';
import { BaseNode, type BaseNodeData } from './BaseNode';

const EMAIL_COLOR = '#d97706'; // Darker Amber (WCAG AA compliant: 3.12:1 contrast with white)
const EMAIL_ICON = '✉️';

export const EmailNode = memo((props: NodeProps<BaseNodeData>) => {
  return <BaseNode {...props} color={EMAIL_COLOR} icon={EMAIL_ICON} />;
});

EmailNode.displayName = 'EmailNode';
