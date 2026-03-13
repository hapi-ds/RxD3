/**
 * GraphToolbar Component
 * Toolbar for graph editing operations
 * 
 * Features:
 * - CreateNodeButton for adding new nodes
 * - CreateRelationshipButton for adding new relationships
 * - UndoButton and RedoButton for undo/redo operations
 * - ExportButton for exporting graph data (future)
 * 
 * Performance Optimizations:
 * - Wrapped with React.memo to prevent unnecessary re-renders
 * 
 * **Validates: Requirements 5.1, 16.2, 16.3, 9.11**
 */

import { memo } from 'react';
import { CreateNodeButton } from './CreateNodeButton';
import { CreateRelationshipButton } from './CreateRelationshipButton';
import { UndoButton } from './UndoButton';
import { RedoButton } from './RedoButton';
import './GraphToolbar.css';

export interface GraphToolbarProps {
  className?: string;
}

/**
 * GraphToolbar Component
 * Provides toolbar with graph editing operations
 */
export const GraphToolbar = memo(function GraphToolbar({ className = '' }: GraphToolbarProps) {
  return (
    <div className={`graph-toolbar ${className}`} role="toolbar" aria-label="Graph editing toolbar">
      <CreateNodeButton />
      <CreateRelationshipButton />
      <div className="toolbar-separator" aria-hidden="true" />
      <UndoButton />
      <RedoButton />
      {/* Future buttons will be added here:
        - ExportButton
      */}
    </div>
  );
});
