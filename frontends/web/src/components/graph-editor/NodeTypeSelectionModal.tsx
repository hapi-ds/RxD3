/**
 * NodeTypeSelectionModal Component
 * Modal for selecting node type when creating a new node
 * 
 * Features:
 * - Displays all 16 available node types
 * - Shows CreateNodeForm after type selection
 * - Handles modal backdrop and close behavior
 * 
 * **Validates: Requirements 5.1, 21.1**
 */

import { useEffect, useState } from 'react';
import type { NodeType, Mind } from '../../types/generated';
import { NODE_TYPE_CONFIGS } from './nodeTypeConfig';
import { CreateNodeForm } from './CreateNodeForm';
import './NodeTypeSelectionModal.css';

export interface NodeTypeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * NodeTypeSelectionModal Component
 * Modal for selecting a node type to create
 */
export function NodeTypeSelectionModal({ isOpen, onClose }: NodeTypeSelectionModalProps) {
  const [selectedType, setSelectedType] = useState<NodeType | null>(null);

  // Reset selected type when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedType(null);
    }
  }, [isOpen]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (selectedType) {
          // If form is showing, go back to type selection
          setSelectedType(null);
        } else {
          // Otherwise close modal
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, selectedType, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  // Handle node type selection
  const handleTypeSelect = (type: NodeType) => {
    setSelectedType(type);
  };

  // Handle successful node creation
  const handleCreateSuccess = (_createdNode: Mind) => {
    // Close modal after successful creation
    onClose();
  };

  // Handle cancel from form
  const handleFormCancel = () => {
    // Go back to type selection
    setSelectedType(null);
  };

  if (!isOpen) {
    return null;
  }

  // Get all node types sorted alphabetically
  const nodeTypes = Object.keys(NODE_TYPE_CONFIGS).sort() as NodeType[];

  return (
    <div
      className="node-type-modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="node-type-modal-title"
    >
      <div className="node-type-modal-content">
        <div className="node-type-modal-header">
          <h2 id="node-type-modal-title" className="node-type-modal-title">
            {selectedType ? `Create ${NODE_TYPE_CONFIGS[selectedType].label}` : 'Select Node Type'}
          </h2>
          <button
            className="node-type-modal-close"
            onClick={onClose}
            aria-label="Close modal"
            title="Close"
          >
            ×
          </button>
        </div>

        <div className="node-type-modal-body">
          {selectedType ? (
            // Show CreateNodeForm after type selection
            <CreateNodeForm
              nodeType={selectedType}
              onSuccess={handleCreateSuccess}
              onCancel={handleFormCancel}
            />
          ) : (
            // Show node type selection grid
            <div className="node-type-grid">
              {nodeTypes.map((type) => {
                const config = NODE_TYPE_CONFIGS[type];
                return (
                  <button
                    key={type}
                    className="node-type-card"
                    onClick={() => handleTypeSelect(type)}
                    aria-label={`Create ${config.label} node`}
                  >
                    <div className="node-type-card-label">{config.label}</div>
                    <div className="node-type-card-type">{type}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {!selectedType && (
          <div className="node-type-modal-footer">
            <button
              className="node-type-modal-cancel"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
