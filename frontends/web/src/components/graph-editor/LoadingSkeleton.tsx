/**
 * LoadingSkeleton Component
 * Displays skeleton screens during initial data load
 * 
 * Features:
 * - Matches the three-panel layout structure
 * - Provides visual feedback during loading
 * - Accessible with ARIA attributes
 * 
 * Requirements: 9.12
 */

import './LoadingSkeleton.css';

/**
 * LoadingSkeleton Component
 * Shows a skeleton screen that matches the GraphEditorLayout structure
 */
export function LoadingSkeleton() {
  return (
    <div 
      className="loading-skeleton" 
      role="status" 
      aria-busy="true" 
      aria-live="polite"
      aria-label="Loading graph editor"
    >
      <div className="skeleton-layout">
        {/* Version History Panel Skeleton */}
        <div className="skeleton-panel skeleton-version-history" aria-label="Loading version history">
          <div className="skeleton-header">
            <div className="skeleton-title"></div>
          </div>
          <div className="skeleton-list">
            <div className="skeleton-list-item"></div>
            <div className="skeleton-list-item"></div>
            <div className="skeleton-list-item"></div>
          </div>
        </div>

        {/* Graph Canvas Skeleton */}
        <div className="skeleton-panel skeleton-graph" aria-label="Loading graph visualization">
          <div className="skeleton-toolbar">
            <div className="skeleton-button"></div>
            <div className="skeleton-button"></div>
            <div className="skeleton-button"></div>
          </div>
          <div className="skeleton-canvas">
            <div className="skeleton-node skeleton-node-1"></div>
            <div className="skeleton-node skeleton-node-2"></div>
            <div className="skeleton-node skeleton-node-3"></div>
            <div className="skeleton-node skeleton-node-4"></div>
            <div className="skeleton-edge skeleton-edge-1"></div>
            <div className="skeleton-edge skeleton-edge-2"></div>
          </div>
        </div>

        {/* Attribute Editor Skeleton */}
        <div className="skeleton-panel skeleton-attribute-editor" aria-label="Loading attribute editor">
          <div className="skeleton-header">
            <div className="skeleton-title"></div>
          </div>
          <div className="skeleton-form">
            <div className="skeleton-field"></div>
            <div className="skeleton-field"></div>
            <div className="skeleton-field"></div>
            <div className="skeleton-field"></div>
          </div>
        </div>
      </div>
      <span className="sr-only">Loading graph data, please wait...</span>
    </div>
  );
}

/**
 * Spinner Component
 * Small loading spinner for inline operations
 */
export function Spinner({ size = 'medium', label = 'Loading' }: { size?: 'small' | 'medium' | 'large'; label?: string }) {
  return (
    <div 
      className={`spinner spinner-${size}`}
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label={label}
    >
      <div className="spinner-circle"></div>
      <span className="sr-only">{label}...</span>
    </div>
  );
}
