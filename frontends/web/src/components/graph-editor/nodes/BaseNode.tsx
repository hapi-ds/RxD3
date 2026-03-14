/**
 * BaseNode Component
 * Base custom node component with common styling for all mind types
 * 
 * **Validates: Requirements 1.1, 1.6, 1.9**
 */

import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from '@reactflow/core';
import type { Mind } from '../GraphEditorContext';
import './BaseNode.css';

export interface BaseNodeData {
  label: string;
  type: string;
  mind: Mind;
  color: string;
  icon: string;
  isFocused?: boolean;
  hasKeyboardFocus?: boolean;
  onMouseEnter?: (event: React.MouseEvent, nodeId: string) => void;
  onMouseLeave?: () => void;
}

export interface BaseNodeProps extends NodeProps<BaseNodeData> {
  color: string;
  icon: string;
}

/**
 * BaseNode - Common node component for all mind types
 */
export const BaseNode = memo(({ id, data, selected, color, icon }: BaseNodeProps) => {
  const handleMouseEnter = (event: React.MouseEvent) => {
    if (data.onMouseEnter) {
      data.onMouseEnter(event, id);
    }
  };

  const handleMouseLeave = () => {
    if (data.onMouseLeave) {
      data.onMouseLeave();
    }
  };

  const classNames = [
    'custom-node',
    selected ? 'selected' : '',
    data.isFocused ? 'focused' : '',
    data.hasKeyboardFocus ? 'keyboard-focused' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classNames}
      style={{
        borderColor: color,
        backgroundColor: `${color}15`,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      tabIndex={0}
      role="button"
      aria-label={`${data.type} node: ${data.label}`}
      aria-pressed={selected}
    >
      <Handle type="target" position={Position.Top} />
      
      <div className="node-header" style={{ backgroundColor: color }}>
        <span className="node-icon">{icon}</span>
        <span className="node-type">{data.type}</span>
      </div>
      
      <div className="node-content">
        <div className="node-title" title={data.label}>
          {data.label}
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

BaseNode.displayName = 'BaseNode';
