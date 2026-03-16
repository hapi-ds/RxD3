/**
 * ScheduleControls component for Classic Project View.
 * Version selector, time scale selector, and max hierarchy depth selector.
 *
 * Requirements: 4.8, 4.12, 4.13
 */

import React from 'react';
import type { ScheduleHistory, GanttChartProps } from '../../types';

interface ScheduleControlsProps {
  versions: ScheduleHistory[];
  selectedVersion: number;
  onVersionChange: (version: number) => void;
  timeScale: GanttChartProps['timeScale'];
  onTimeScaleChange: (scale: GanttChartProps['timeScale']) => void;
  maxDepth: number;
  onMaxDepthChange: (depth: number) => void;
}

const TIME_SCALES: Array<{ value: GanttChartProps['timeScale']; label: string }> = [
  { value: 'weeks', label: 'Weeks' },
  { value: 'months', label: 'Months' },
  { value: 'quarters', label: 'Quarters' },
  { value: 'years', label: 'Years' },
];

export const ScheduleControls: React.FC<ScheduleControlsProps> = React.memo(({
  versions, selectedVersion, onVersionChange,
  timeScale, onTimeScaleChange,
  maxDepth, onMaxDepthChange,
}) => {
  return (
    <div className="schedule-controls">
      <label>
        Version:
        <select
          value={selectedVersion}
          onChange={e => onVersionChange(Number(e.target.value))}
          aria-label="Schedule version"
        >
          {versions.map(v => (
            <option key={v.version} value={v.version}>
              v{v.version} — {new Date(v.scheduled_at).toLocaleDateString()}
            </option>
          ))}
        </select>
      </label>

      <label>
        Time Scale:
        <select
          value={timeScale}
          onChange={e => onTimeScaleChange(e.target.value as GanttChartProps['timeScale'])}
          aria-label="Time scale"
        >
          {TIME_SCALES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </label>

      <label>
        Max Depth:
        <select
          value={maxDepth}
          onChange={e => onMaxDepthChange(Number(e.target.value))}
          aria-label="Max hierarchy depth"
        >
          {[1, 2, 3, 4, 5].map(d => (
            <option key={d} value={d}>Level {d}</option>
          ))}
        </select>
      </label>
    </div>
  );
});

ScheduleControls.displayName = 'ScheduleControls';
