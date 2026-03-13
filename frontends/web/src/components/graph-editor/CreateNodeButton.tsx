/**
 * CreateNodeButton Component
 * Button that opens a modal for creating new nodes
 * 
 * Features:
 * - Opens modal with node type selector
 * - Shows CreateNodeForm for selected type
 * - Handles modal open/close state
 * 
 * Performance Optimizations:
 * - Wrapped with React.memo to prevent unnecessary re-renders
 * - Event handlers use useCallback for stable references
 * 
 * **Validates: Requirements 5.1, 9.11**
 */

import { useState, memo, useCallback } from 'react';
import { NodeTypeSelectionModal } from './NodeTypeSelectionModal';
import './CreateNodeButton.css';

/**
 * CreateNodeButton Component
 * Button that triggers node creation workflow
 */
export const CreateNodeButton = memo(function CreateNodeButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  return (
    <>
      <button
        className="create-node-button"
        onClick={handleOpenModal}
        aria-label="Create new node"
        title="Create new node"
      >
        <span className="create-node-button-icon">+</span>
        <span className="create-node-button-text">Create Node</span>
      </button>

      {isModalOpen && (
        <NodeTypeSelectionModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
});
