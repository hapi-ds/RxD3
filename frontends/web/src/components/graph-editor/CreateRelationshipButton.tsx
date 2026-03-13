/**
 * CreateRelationshipButton Component
 * Button that opens a modal for creating new relationships between nodes
 * 
 * Features:
 * - Opens modal for relationship creation
 * - Allows selecting source and target nodes
 * - Prompts for relationship type
 * - Validates selections and creates relationship
 * 
 * Performance Optimizations:
 * - Wrapped with React.memo to prevent unnecessary re-renders
 * - Event handlers use useCallback for stable references
 * 
 * **Validates: Requirements 5.2, 5.4, 9.11**
 */

import { useState, memo, useCallback } from 'react';
import { CreateRelationshipModal } from './CreateRelationshipModal';
import './CreateRelationshipButton.css';

/**
 * CreateRelationshipButton Component
 * Button that triggers relationship creation workflow
 */
export const CreateRelationshipButton = memo(function CreateRelationshipButton() {
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
        className="create-relationship-button"
        onClick={handleOpenModal}
        aria-label="Create new relationship"
        title="Create new relationship"
      >
        <span className="create-relationship-button-icon">→</span>
        <span className="create-relationship-button-text">Create Relationship</span>
      </button>

      {isModalOpen && (
        <CreateRelationshipModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
});
