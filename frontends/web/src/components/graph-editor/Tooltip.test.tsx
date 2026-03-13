/**
 * Tooltip Component Tests
 * Tests for tooltip display functionality
 * 
 * **Validates: Requirements 1.6, 1.7**
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
  it('should not render when visible is false', () => {
    const { container } = render(
      <Tooltip
        visible={false}
        content={<div>Test Content</div>}
        x={100}
        y={100}
      />
    );
    
    expect(container.querySelector('.graph-tooltip')).toBeNull();
  });

  it('should render when visible is true', () => {
    render(
      <Tooltip
        visible={true}
        content={<div>Test Content</div>}
        x={100}
        y={100}
      />
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should position tooltip near cursor with offset', () => {
    const { container } = render(
      <Tooltip
        visible={true}
        content={<div>Test Content</div>}
        x={100}
        y={200}
      />
    );
    
    const tooltip = container.querySelector('.graph-tooltip');
    expect(tooltip).toHaveStyle({
      left: '110px', // x + 10
      top: '210px',  // y + 10
    });
  });

  it('should render node tooltip content with title and type', () => {
    render(
      <Tooltip
        visible={true}
        content={
          <div>
            <div className="tooltip-title">My Project</div>
            <div className="tooltip-type">Project</div>
          </div>
        }
        x={100}
        y={100}
      />
    );
    
    expect(screen.getByText('My Project')).toBeInTheDocument();
    expect(screen.getByText('Project')).toBeInTheDocument();
  });

  it('should render edge tooltip content with relationship type', () => {
    render(
      <Tooltip
        visible={true}
        content={
          <div>
            <div className="tooltip-relationship-type">CONTAINS</div>
          </div>
        }
        x={100}
        y={100}
      />
    );
    
    expect(screen.getByText('CONTAINS')).toBeInTheDocument();
  });
});
