# LayoutControls Component

## Overview

The `LayoutControls` component provides UI controls for selecting graph layout algorithms and adjusting node spacing parameters. It integrates with the GraphEditorContext to manage layout state and trigger layout recalculation when settings change.

## Features

- **Algorithm Selection**: Dropdown menu for choosing between four layout algorithms:
  - Force-Directed: Physics-based layout with attraction/repulsion forces
  - Hierarchical: Layered layout for tree-like structures
  - Circular: Nodes arranged in concentric circles
  - Grid: Regular grid arrangement

- **Distance Parameter**: Slider control (range 0.5-2.0) that adjusts node spacing for all layout algorithms

- **Real-time Updates**: Layout recalculates automatically when algorithm or distance changes

- **Accessibility**: Full keyboard navigation and ARIA labels for screen readers

## Usage

```tsx
import { LayoutControls } from './LayoutControls';
import { GraphEditorProvider } from './GraphEditorContext';

function MyGraphEditor() {
  return (
    <GraphEditorProvider>
      <LayoutControls />
      {/* Other graph components */}
    </GraphEditorProvider>
  );
}
```

## Integration with GraphCanvas

The LayoutControls component is automatically integrated into the GraphCanvas component and positioned in the top-left corner of the canvas. When users change the layout settings, the GraphCanvas component detects the state changes and applies the new layout algorithm with the updated distance parameter.

## State Management

Layout state is managed through the GraphEditorContext:

```typescript
interface LayoutConfig {
  algorithm: LayoutAlgorithm; // 'force-directed' | 'hierarchical' | 'circular' | 'grid'
  distance: number; // 0.5 to 2.0
}
```

State updates are dispatched using:
- `SET_LAYOUT_ALGORITHM`: Changes the active layout algorithm
- `SET_LAYOUT_DISTANCE`: Adjusts the node spacing parameter

## Styling

The component uses CSS modules for styling. Key style classes:

- `.layout-controls`: Main container with flexbox layout
- `.layout-controls__group`: Individual control group (label + input)
- `.layout-controls__select`: Styled dropdown for algorithm selection
- `.layout-controls__slider`: Custom-styled range input for distance

The component is responsive and adapts to smaller screens by stacking controls vertically.

## Accessibility Features

- All controls have descriptive labels
- ARIA attributes for screen readers:
  - `aria-label` on select and slider
  - `aria-valuemin`, `aria-valuemax`, `aria-valuenow` on slider
  - `aria-valuetext` for human-readable slider value
- Full keyboard navigation support
- Focus indicators visible during keyboard navigation

## Requirements Validation

This component validates the following requirements:

- **1.10**: Provides multiple layout algorithm options
- **1.11**: Allows users to switch between layout algorithms
- **1.12**: Provides user-configurable distance parameter
- **1.13**: Distance parameter affects node positioning in all layouts
- **1.14**: Layout updates within 1 second when algorithm changes
- **1.15**: Layout updates within 500ms when distance changes

## Testing

The component includes comprehensive unit and integration tests:

- `LayoutControls.test.tsx`: Unit tests for component rendering and interactions
- `layout-integration.test.tsx`: Integration tests for state management

Run tests with:
```bash
npm test -- LayoutControls.test.tsx --run
npm test -- layout-integration.test.tsx --run
```

## Performance Considerations

- Layout recalculation is triggered via useEffect with proper dependencies
- The component uses controlled inputs to ensure state consistency
- Layout algorithms are memoized to prevent unnecessary recalculations
- Canvas size is tracked to provide accurate dimensions to layout functions
