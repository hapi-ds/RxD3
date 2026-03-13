# Layout Algorithms

This directory contains layout algorithms for positioning nodes in the Mind Graph Editor.

## Overview

The layout system provides four different algorithms for arranging nodes in the graph visualization:

1. **Force-Directed Layout** - Physics-based simulation using attraction and repulsion forces
2. **Hierarchical Layout** - Layered arrangement suitable for directed acyclic graphs
3. **Circular Layout** - Nodes arranged in concentric circles, grouped by type
4. **Grid Layout** - Regular grid arrangement with nodes sorted by type and title

## Architecture

### Core Types

- `NodePosition` - Represents a node's position in 2D space (id, x, y)
- `LayoutFunction` - Function signature for all layout algorithms
- `LayoutAlgorithm` - Union type of available algorithm names

### Layout Interface

All layout algorithms implement the same interface:

```typescript
type LayoutFunction = (
  nodes: Mind[],
  edges: Relationship[],
  distance: number,
  width: number,
  height: number
) => NodePosition[];
```

**Parameters:**
- `nodes` - Array of Mind nodes to position
- `edges` - Array of Relationship edges connecting nodes
- `distance` - Distance multiplier controlling node spacing (0.5-2.0)
- `width` - Canvas width in pixels
- `height` - Canvas height in pixels

**Returns:**
- Array of `NodePosition` objects with id, x, y coordinates

## Algorithms

### Force-Directed Layout

**File:** `forceDirectedLayout.ts`

Uses D3-force simulation with three forces:
- **Link force** - Attracts connected nodes (distance × 100px)
- **Charge force** - Repels all nodes from each other (strength: -distance × 300)
- **Center force** - Pulls nodes toward canvas center

**Best for:** General-purpose graphs, organic layouts, showing relationships

**Distance effect:** Affects both link distance and repulsion strength

### Hierarchical Layout

**File:** `hierarchicalLayout.ts`

Uses Dagre library (Sugiyama framework) for layered graph drawing:
- Nodes arranged in horizontal layers
- Edges flow top-to-bottom
- Minimizes edge crossings
- Centers graph on canvas

**Best for:** Directed acyclic graphs, workflows, dependency trees

**Distance effect:** Controls vertical spacing between layers (distance × 100px)

### Circular Layout

**File:** `circularLayout.ts`

Arranges nodes in circles:
- Single circle for one node type or ≤10 nodes
- Concentric circles for multiple types
- Nodes distributed evenly around circumference
- Groups by `__primarylabel__` type

**Best for:** Showing relationships between groups, cyclic structures

**Distance effect:** Controls radius (distance × 0.35 × min(width, height))

### Grid Layout

**File:** `gridLayout.ts`

Arranges nodes in a regular grid:
- Calculates optimal grid dimensions (√n columns)
- Sorts nodes by type, then title
- Places in row-major order
- Centers grid on canvas

**Best for:** Comparing many nodes, alphabetical browsing

**Distance effect:** Controls cell size (distance × 200px)

## Usage

### Basic Usage

```typescript
import { forceDirectedLayout } from './layouts';

const positions = forceDirectedLayout(
  nodes,
  edges,
  1.0,  // distance multiplier
  800,  // canvas width
  600   // canvas height
);
```

### Using the Registry

```typescript
import { getLayoutFunction, getAvailableLayouts } from './layouts';

// Get all available layouts
const layouts = getAvailableLayouts();
// ['force-directed', 'hierarchical', 'circular', 'grid']

// Get layout function by name
const layoutFn = getLayoutFunction('force-directed');
const positions = layoutFn(nodes, edges, 1.0, 800, 600);
```

### Dynamic Layout Selection

```typescript
import { LAYOUT_ALGORITHMS } from './layouts';

function applyLayout(algorithm: LayoutAlgorithm, distance: number) {
  const layoutFn = LAYOUT_ALGORITHMS[algorithm];
  return layoutFn(nodes, edges, distance, width, height);
}
```

## Distance Parameter

The `distance` parameter (range 0.5-2.0) controls node spacing:

- **0.5** - Compact layout, nodes closer together
- **1.0** - Default spacing
- **2.0** - Expanded layout, nodes farther apart

Each algorithm interprets distance differently:
- Force-directed: Affects link distance and repulsion
- Hierarchical: Affects layer spacing
- Circular: Affects radius
- Grid: Affects cell size

## Testing

Unit tests are in `layouts.test.ts` and cover:
- Empty input handling
- Node positioning correctness
- Distance parameter effects
- Layout registry functionality

Run tests:
```bash
npm test -- layouts.test.ts --run
```

## Requirements Validation

This implementation validates:
- **Requirement 1.10** - Provides all four layout algorithms
- **Requirement 1.12** - Supports user-configurable distance parameter
- **Requirement 1.13** - Distance parameter affects all layouts

## Dependencies

- `d3-force` (^3.0.0) - Force-directed layout simulation
- `dagre` (^0.8.5) - Hierarchical layout algorithm

## Future Enhancements

Potential improvements:
- Animation/transitions between layouts
- Custom layout configurations per algorithm
- Layout persistence (save/restore positions)
- Incremental layout updates for large graphs
- WebWorker support for heavy computations
