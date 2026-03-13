# Custom Node Components

This directory contains custom node components for the Mind Graph Editor. Each Mind type has a dedicated node component with distinct visual styling.

## Node Types and Colors

| Mind Type | Color | Hex Code | Icon | Component |
|-----------|-------|----------|------|-----------|
| Project | Blue | `#3b82f6` | 📁 | ProjectNode |
| Task | Green | `#10b981` | ✓ | TaskNode |
| Company | Purple | `#8b5cf6` | 🏢 | CompanyNode |
| Department | Cyan | `#06b6d4` | 🏛️ | DepartmentNode |
| Email | Amber | `#f59e0b` | ✉️ | EmailNode |
| Knowledge | Pink | `#ec4899` | 💡 | KnowledgeNode |
| AcceptanceCriteria | Teal | `#14b8a6` | ✔️ | AcceptanceCriteriaNode |
| Risk | Red | `#ef4444` | ⚠️ | RiskNode |
| Failure | Dark Red | `#dc2626` | ❌ | FailureNode |
| Requirement | Indigo | `#6366f1` | 📋 | RequirementNode |
| Resource | Lime | `#84cc16` | 👤 | ResourceNode |
| Journalentry | Purple | `#a855f7` | 📝 | JournalentryNode |
| Booking | Orange | `#f97316` | 📅 | BookingNode |
| Account | Emerald | `#059669` | 💰 | AccountNode |
| ScheduleHistory | Slate | `#64748b` | 📊 | ScheduleHistoryNode |
| ScheduledTask | Cyan | `#0891b2` | ⏰ | ScheduledTaskNode |

## Architecture

### BaseNode Component

The `BaseNode` component provides common styling and structure for all node types:

- **Header**: Displays node type and icon with colored background
- **Content**: Shows the node title (truncated to 2 lines)
- **Handles**: Connection points for edges (top and bottom)
- **Styling**: Consistent border, shadow, and hover effects

### Specialized Node Components

Each Mind type has a specialized component that wraps `BaseNode` with:
- Type-specific color
- Type-specific icon
- Memoization for performance optimization

### Integration with React Flow

The `nodeTypes` configuration object maps Mind type names to their components:

```typescript
export const nodeTypes: NodeTypes = {
  Project: ProjectNode,
  Task: TaskNode,
  // ... all 16 types
};
```

This configuration is passed to React Flow's `<ReactFlow>` component in `GraphCanvas.tsx`.

## Usage

The custom nodes are automatically used when rendering minds in the graph:

```typescript
// In GraphCanvas.tsx
function mindToNode(mind: Mind): Node {
  return {
    id: mind.uuid!,
    type: mind.__primarylabel__, // Maps to nodeTypes configuration
    position: { x: 0, y: 0 },
    data: {
      label: mind.title,
      type: mind.__primarylabel__,
      mind,
    },
  };
}
```

## Styling

Node styling is defined in `BaseNode.css`:
- Responsive width (180px - 250px)
- 2px colored border (3px when selected)
- Rounded corners (8px)
- Box shadow with hover effect
- Smooth transitions

## Testing

Tests are located in `CustomNodes.test.tsx` and verify:
- All 16 node types are registered
- All node types have distinct colors
- Colors use valid hex format
- nodeTypes and nodeColors configurations are consistent

## Requirements Validation

**Validates: Requirements 1.1, 1.9**
- 1.1: Graph Editor renders all minds as nodes
- 1.9: Graph Editor uses distinct visual styles for different node types
