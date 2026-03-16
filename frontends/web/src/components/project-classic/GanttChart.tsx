/**
 * GanttChart SVG component for Classic Project View.
 * Renders read-only task bars, dependency connectors, critical path coloring,
 * progress fill, weekend shading, and date headers.
 *
 * Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.14
 */

import React, { useMemo } from 'react';
import type { GanttChartProps } from '../../types';

const ROW_HEIGHT = 32;
const HEADER_HEIGHT = 40;
const COLORS = { critical: '#e74c3c', standard: '#3498db', weekend: '#f2f2f2', grid: '#eee', progress: 'rgba(255,255,255,0.4)' };

/** Compute pixel-per-day based on time scale */
function getPxPerDay(timeScale: GanttChartProps['timeScale']): number {
  switch (timeScale) {
    case 'weeks': return 30;
    case 'months': return 10;
    case 'quarters': return 4;
    case 'years': return 1.5;
  }
}

/** Generate date header labels based on time scale */
function getDateLabels(start: Date, end: Date, timeScale: GanttChartProps['timeScale']): Array<{ label: string; x: number; width: number }> {
  const labels: Array<{ label: string; x: number; width: number }> = [];
  const pxPerDay = getPxPerDay(timeScale);
  const current = new Date(start);

  while (current <= end) {
    const dayOffset = Math.floor((current.getTime() - start.getTime()) / 86400000);
    let label = '';
    let daysInPeriod = 1;

    if (timeScale === 'weeks') {
      label = current.toLocaleDateString('en', { month: 'short', day: 'numeric' });
      daysInPeriod = 7;
    } else if (timeScale === 'months') {
      label = current.toLocaleDateString('en', { month: 'short', year: '2-digit' });
      daysInPeriod = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
    } else if (timeScale === 'quarters') {
      const q = Math.floor(current.getMonth() / 3) + 1;
      label = `Q${q} ${current.getFullYear()}`;
      daysInPeriod = 90;
    } else {
      label = `${current.getFullYear()}`;
      daysInPeriod = 365;
    }

    labels.push({ label, x: dayOffset * pxPerDay, width: daysInPeriod * pxPerDay });

    if (timeScale === 'weeks') current.setDate(current.getDate() + 7);
    else if (timeScale === 'months') current.setMonth(current.getMonth() + 1);
    else if (timeScale === 'quarters') current.setMonth(current.getMonth() + 3);
    else current.setFullYear(current.getFullYear() + 1);
  }
  return labels;
}

export const GanttChart: React.FC<GanttChartProps> = React.memo(({ tasks, timeScale, maxDepth, globalStart, globalEnd }) => {
  const startDate = useMemo(() => new Date(globalStart), [globalStart]);
  const endDate = useMemo(() => new Date(globalEnd), [globalEnd]);
  const pxPerDay = getPxPerDay(timeScale);

  const filteredTasks = useMemo(
    () => tasks.filter(t => (t.hierarchy_level ?? 0) <= maxDepth),
    [tasks, maxDepth]
  );

  const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000) + 7);
  const svgWidth = totalDays * pxPerDay;
  const svgHeight = filteredTasks.length * ROW_HEIGHT;

  const dateLabels = useMemo(() => getDateLabels(startDate, endDate, timeScale), [startDate, endDate, timeScale]);

  // Build task position lookup for dependency connectors
  const taskPositions = useMemo(() => {
    const map = new Map<string, { x: number; width: number; y: number }>();
    filteredTasks.forEach((t, i) => {
      const taskStart = new Date(t.scheduled_start);
      const dayOffset = Math.max(0, (taskStart.getTime() - startDate.getTime()) / 86400000);
      const barWidth = Math.max(pxPerDay * 0.5, t.scheduled_duration * pxPerDay);
      map.set(t.source_task_uuid, { x: dayOffset * pxPerDay, width: barWidth, y: i * ROW_HEIGHT + ROW_HEIGHT / 2 });
    });
    return map;
  }, [filteredTasks, startDate, pxPerDay]);

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={svgWidth} height={HEADER_HEIGHT + svgHeight} role="img" aria-label="Gantt Chart">
        {/* Date header */}
        <g>
          <rect x={0} y={0} width={svgWidth} height={HEADER_HEIGHT} fill="#2c3e50" />
          {dateLabels.map((dl, i) => (
            <text key={i} x={dl.x + dl.width / 2} y={HEADER_HEIGHT / 2 + 4} textAnchor="middle" fill="white" fontSize={10}>{dl.label}</text>
          ))}
        </g>

        <g transform={`translate(0, ${HEADER_HEIGHT})`}>
          {/* Weekend shading (only for weeks scale) */}
          {timeScale === 'weeks' && Array.from({ length: totalDays }, (_, d) => {
            const day = new Date(startDate);
            day.setDate(day.getDate() + d);
            const dow = day.getDay();
            if (dow === 0 || dow === 6) {
              return <rect key={`we-${d}`} x={d * pxPerDay} y={0} width={pxPerDay} height={svgHeight} fill={COLORS.weekend} />;
            }
            return null;
          })}

          {/* Grid lines */}
          {dateLabels.map((dl, i) => (
            <line key={`gl-${i}`} x1={dl.x} y1={0} x2={dl.x} y2={svgHeight} stroke={COLORS.grid} strokeWidth={0.5} />
          ))}

          {/* Dependency connectors */}
          {filteredTasks.map(t =>
            t.predecessors.map((predUuid, depIndex) => {
              const pred = taskPositions.get(predUuid);
              const succ = taskPositions.get(t.source_task_uuid);
              if (!pred || !succ) return null;
              const sx = pred.x + pred.width;
              const sy = pred.y;
              const ex = succ.x;
              const ey = succ.y;
              const gap = ex - sx;
              const isCrit = t.is_critical && filteredTasks.find(ft => ft.source_task_uuid === predUuid)?.is_critical;
              
              // Offset for multiple connectors to the same task (so they don't overlap)
              const connectorOffset = depIndex * 4;
              
              let d: string;
              if (gap > 24) {
                // Enough space: route right, then vertical, then right to target
                const midX = sx + gap / 2 + connectorOffset;
                d = `M${sx},${sy} L${midX},${sy} L${midX},${ey} L${ex},${ey}`;
              } else {
                // Tight space: route right a bit, then go back (left) between the rows,
                // then vertical to target row level, then right to target.
                // The "back" point is between predecessor end and successor start.
                const stepOut = 6;
                const backX = Math.min(sx, ex) - 12 - connectorOffset; // Go left of both bars
                // Vertical midpoint between the two task rows
                const midY = (sy + ey) / 2;
                d = `M${sx},${sy} L${sx + stepOut},${sy} L${sx + stepOut},${midY} L${backX},${midY} L${backX},${ey} L${ex},${ey}`;
              }
              return (
                <path
                  key={`dep-${predUuid}-${t.source_task_uuid}`}
                  d={d}
                  fill="none"
                  stroke={isCrit ? COLORS.critical : '#adb5bd'}
                  strokeWidth={isCrit ? 2 : 1.5}
                  markerEnd="url(#arrow)"
                />
              );
            })
          )}

          {/* Task bars */}
          {filteredTasks.map((t, i) => {
            const pos = taskPositions.get(t.source_task_uuid);
            if (!pos) return null;
            const barY = i * ROW_HEIGHT + 6;
            const barH = ROW_HEIGHT - 12;
            const fillColor = t.is_critical ? COLORS.critical : COLORS.standard;
            const progressWidth = pos.width * Math.min(t.progress, 1);
            const isMilestone = t.task_type === 'MILESTONE';

            if (isMilestone) {
              const cx = pos.x;
              const cy = i * ROW_HEIGHT + ROW_HEIGHT / 2;
              const size = 7;
              return (
                <g key={t.uuid}>
                  <polygon
                    points={`${cx},${cy - size} ${cx + size},${cy} ${cx},${cy + size} ${cx - size},${cy}`}
                    fill="#2c3e50"
                    stroke="#2c3e50"
                    strokeWidth={1}
                  />
                </g>
              );
            }

            return (
              <g key={t.uuid}>
                {/* Background bar */}
                <rect x={pos.x} y={barY} width={pos.width} height={barH} rx={3} fill="#e9ecef" />
                {/* Colored bar */}
                <rect x={pos.x} y={barY} width={pos.width} height={barH} rx={3} fill={fillColor} opacity={0.8} />
                {/* Progress fill */}
                {t.progress > 0 && (
                  <rect x={pos.x} y={barY} width={progressWidth} height={barH} rx={3} fill={fillColor} />
                )}
                {/* Label */}
                <text x={pos.x + 4} y={barY + barH / 2 + 3} fontSize={9} fill="white" fontWeight="bold">
                  {t.progress > 0 ? `${Math.round(t.progress * 100)}%` : ''}
                </text>
              </g>
            );
          })}

          {/* Arrow marker definition */}
          <defs>
            <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0.5 L0,5.5 L6,3 z" fill="#adb5bd" />
            </marker>
          </defs>
        </g>
      </svg>
    </div>
  );
});

GanttChart.displayName = 'GanttChart';
