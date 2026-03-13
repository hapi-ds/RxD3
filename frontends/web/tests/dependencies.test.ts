/**
 * Dependency verification tests
 * Validates that all new dependencies for mind-graph-editor are properly installed
 */
import { describe, it, expect } from 'vitest';

describe('Mind Graph Editor Dependencies', () => {
  it('should import reactflow successfully', async () => {
    const reactflow = await import('reactflow');
    expect(reactflow).toBeDefined();
    expect(reactflow.ReactFlow).toBeDefined();
  });

  it('should import d3-force successfully', async () => {
    const d3Force = await import('d3-force');
    expect(d3Force).toBeDefined();
    expect(d3Force.forceSimulation).toBeDefined();
    expect(d3Force.forceLink).toBeDefined();
    expect(d3Force.forceManyBody).toBeDefined();
    expect(d3Force.forceCenter).toBeDefined();
  });

  it('should import dagre successfully', async () => {
    const dagre = await import('dagre');
    expect(dagre).toBeDefined();
    expect(dagre.graphlib).toBeDefined();
  });

  it('should import fast-check successfully', async () => {
    const fc = await import('fast-check');
    expect(fc).toBeDefined();
    expect(fc.assert).toBeDefined();
    expect(fc.property).toBeDefined();
  });
});
