/**
 * BookingNode Component
 * Custom node for Booking mind type
 * **Validates: Requirements 1.1, 1.9**
 */

import { memo } from 'react';
import { type NodeProps } from 'reactflow';
import { BaseNode, type BaseNodeData } from './BaseNode';

const BOOKING_COLOR = '#ea580c'; // Darker Orange (WCAG AA compliant: 3.21:1 contrast with white)
const BOOKING_ICON = '📅';

export const BookingNode = memo((props: NodeProps<BaseNodeData>) => {
  return <BaseNode {...props} color={BOOKING_COLOR} icon={BOOKING_ICON} />;
});

BookingNode.displayName = 'BookingNode';
