/**
 * Tooltip Component
 * Displays tooltip near cursor on hover
 * 
 * **Validates: Requirements 1.6, 1.7**
 */

import { useEffect, useState } from 'react';
import './Tooltip.css';

export interface TooltipProps {
  content: React.ReactNode;
  visible: boolean;
  x: number;
  y: number;
}

/**
 * Tooltip - Displays content near cursor position
 */
export function Tooltip({ content, visible, x, y }: TooltipProps) {
  const [position, setPosition] = useState({ x, y });

  useEffect(() => {
    if (visible) {
      // Offset tooltip slightly from cursor to avoid flickering
      setPosition({ x: x + 10, y: y + 10 });
    }
  }, [visible, x, y]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className="graph-tooltip"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      {content}
    </div>
  );
}
