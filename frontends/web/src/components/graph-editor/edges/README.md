# Custom Edge Components

This directory contains custom edge components for the Mind Graph Editor.

## CustomEdge Component

The `CustomEdge` component provides type-based styling and arrow markers for relationship edges in the graph visualization.

### Relationship Types and Styling

| Relationship Type | Color | Style | Description |
|------------------|-------|-------|-------------|
| `CONTAINS` | Blue (#3b82f6) | Solid | Containment relationships |
| `DEPENDS_ON` | Red (#ef4444) | Dashed | Dependency relationships |
| `ASSIGNED_TO` | Green (#10b981) | Solid | Assignment relationships |
| `RELATES_TO` | Gray (#6b7280) | Solid | General relationships |
| `IMPLEMENTS` | Purple (#8b5cf6) | Solid | Implementation relationships |
| `MITIGATES` | Orange (#f59e0b) | Solid | Mitigation relationships |
| `PREVIOUS` | Slate (#64748b) | Dotted | Version history |
| `SCHEDULED` | Cyan (#06b6d4) | Solid | Scheduling relationships |
| `TO` | Gray (#6b7280) | Solid | General direction |
| `FOR` | Gray (#6b7280) | Solid | General purpose |
| `REFINES` | Pink (#ec4899) | Solid | Refinement relationships |

### Features

- **Type-based styling**: Each relationship type has a unique color and stroke style
- **Arrow markers**: All edges display directional arrows at the target end
- **Hover effects**: Edges become thicker on hover for better visibility
- **Selection support**: Selected edges are highlighted with increased stroke width

### Usage

The custom edge is automatically used by the GraphCanvas component through the `edgeTypes` configuration:

```typescript
import { edgeTypes } from './edges';

<ReactFlow
  nodes={nodes}
  edges={edges}
  edgeTypes={edgeTypes}
  // ... other props
/>
```

### Testing

Run tests with:
```bash
npm test -- edges/CustomEdge.test.tsx --run
```

**Validates: Requirements 1.2**
