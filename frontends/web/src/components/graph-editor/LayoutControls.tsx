/**
 * LayoutControls Component
 * 
 * Provides UI controls for layout algorithm selection and distance parameter adjustment
 * 
 * Responsibilities:
 * - Dropdown for algorithm selection (force-directed, hierarchical, circular, grid)
 * - Distance slider (range 0.5-2.0)
 * - Wire controls to state management
 * - Apply layout on algorithm or distance change
 * 
 * Performance Optimizations:
 * - Wrapped with React.memo to prevent unnecessary re-renders
 * - Event handlers use useCallback for stable references
 * 
 * **Validates: Requirements 1.10, 1.11, 1.12, 1.13, 9.11**
 */

import { memo, useCallback } from 'react';
import { useGraphEditor, type LayoutAlgorithm } from './GraphEditorContext';
import { getAvailableLayouts } from './layouts';
import './LayoutControls.css';

/**
 * Human-readable labels for layout algorithms
 */
const LAYOUT_LABELS: Record<LayoutAlgorithm, string> = {
  'force-directed': 'Force-Directed',
  'hierarchical': 'Hierarchical',
  'circular': 'Circular',
  'grid': 'Grid',
};

/**
 * LayoutControls Component
 * 
 * Provides controls for selecting layout algorithm and adjusting distance parameter
 */
export const LayoutControls = memo(function LayoutControls() {
  const { state, dispatch } = useGraphEditor();
  const { algorithm, distance } = state.layout;
  
  const availableLayouts = getAvailableLayouts();
  
  /**
   * Handle layout algorithm change
   */
  const handleAlgorithmChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const newAlgorithm = event.target.value as LayoutAlgorithm;
    dispatch({ type: 'SET_LAYOUT_ALGORITHM', payload: newAlgorithm });
  }, [dispatch]);
  
  /**
   * Handle distance parameter change
   */
  const handleDistanceChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newDistance = parseFloat(event.target.value);
    dispatch({ type: 'SET_LAYOUT_DISTANCE', payload: newDistance });
  }, [dispatch]);
  
  return (
    <div className="layout-controls">
      <div className="layout-controls__group">
        <label htmlFor="layout-algorithm" className="layout-controls__label">
          Layout Algorithm
        </label>
        <select
          id="layout-algorithm"
          className="layout-controls__select"
          value={algorithm}
          onChange={handleAlgorithmChange}
          aria-label="Select layout algorithm"
        >
          {availableLayouts.map((layout) => (
            <option key={layout} value={layout}>
              {LAYOUT_LABELS[layout]}
            </option>
          ))}
        </select>
      </div>
      
      <div className="layout-controls__group">
        <label htmlFor="layout-distance" className="layout-controls__label">
          Node Distance: {distance.toFixed(1)}
        </label>
        <input
          id="layout-distance"
          type="range"
          className="layout-controls__slider"
          min="0.5"
          max="2.0"
          step="0.1"
          value={distance}
          onChange={handleDistanceChange}
          aria-label="Adjust node distance"
          aria-valuemin={0.5}
          aria-valuemax={2.0}
          aria-valuenow={distance}
          aria-valuetext={`Distance: ${distance.toFixed(1)}`}
        />
      </div>
    </div>
  );
});
