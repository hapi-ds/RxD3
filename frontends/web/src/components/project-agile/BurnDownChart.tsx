/**
 * BurnDownChart SVG component for Agile Project View.
 * Plots ideal effort line (linear from total to zero) and actual effort line
 * (based on cumulative bookings over time).
 *
 * Requirements: 5.2, 5.6
 */

import React, { useMemo } from 'react';

export interface BurnDownDataPoint {
  label: string;       // X-axis label (date or sprint name)
  date: string;        // ISO date for sorting
  ideal: number;       // Ideal remaining effort
  actual: number;      // Actual remaining effort (total - booked)
}

interface BurnDownChartProps {
  data: BurnDownDataPoint[];
  totalEffort: number;
  title?: string;
}

const WIDTH = 600;
const HEIGHT = 300;
const PADDING = { top: 20, right: 20, bottom: 50, left: 60 };
const CHART_W = WIDTH - PADDING.left - PADDING.right;
const CHART_H = HEIGHT - PADDING.top - PADDING.bottom;

export const BurnDownChart: React.FC<BurnDownChartProps> = React.memo(({ data, totalEffort, title }) => {
  const maxEffort = useMemo(() => Math.max(totalEffort, ...data.map(d => Math.max(d.ideal, d.actual))), [data, totalEffort]);
  const pointCount = data.length;

  const scaleX = (i: number): number => PADDING.left + (i / Math.max(pointCount - 1, 1)) * CHART_W;
  const scaleY = (v: number): number => PADDING.top + CHART_H - (v / Math.max(maxEffort, 1)) * CHART_H;

  const idealLine = useMemo(() => {
    if (pointCount < 2) return '';
    // Ideal is always a straight line from first point's ideal to last point's ideal
    const startX = scaleX(0);
    const startY = scaleY(data[0].ideal);
    const endX = scaleX(pointCount - 1);
    const endY = scaleY(data[pointCount - 1].ideal);
    return `M${startX},${startY} L${endX},${endY}`;
  }, [data, pointCount]);

  const actualLine = useMemo(() => {
    if (pointCount === 0) return '';
    const points = data.map((d, i) => `${scaleX(i)},${scaleY(d.actual)}`);
    return `M${points.join(' L')}`;
  }, [data, pointCount]);

  // Show fewer labels if there are many points
  const labelStep = pointCount > 10 ? Math.ceil(pointCount / 8) : 1;

  return (
    <svg width={WIDTH} height={HEIGHT} role="img" aria-label={title || "Burn-down Chart"} className="burndown-chart">
      {/* Y-axis */}
      <line x1={PADDING.left} y1={PADDING.top} x2={PADDING.left} y2={PADDING.top + CHART_H} stroke="#333" />
      <text x={PADDING.left - 8} y={PADDING.top + CHART_H / 2} textAnchor="middle" fontSize={11} fill="#555" transform={`rotate(-90, ${PADDING.left - 35}, ${PADDING.top + CHART_H / 2})`}>
        Effort (hours)
      </text>
      {/* Y-axis ticks */}
      {[0, 0.25, 0.5, 0.75, 1].map(frac => {
        const val = maxEffort * frac;
        const y = scaleY(val);
        return (
          <g key={frac}>
            <line x1={PADDING.left - 4} y1={y} x2={PADDING.left} y2={y} stroke="#333" />
            <text x={PADDING.left - 8} y={y + 4} textAnchor="end" fontSize={9} fill="#555">{Math.round(val)}</text>
            <line x1={PADDING.left} y1={y} x2={PADDING.left + CHART_W} y2={y} stroke="#eee" />
          </g>
        );
      })}

      {/* X-axis */}
      <line x1={PADDING.left} y1={PADDING.top + CHART_H} x2={PADDING.left + CHART_W} y2={PADDING.top + CHART_H} stroke="#333" />
      {data.map((d, i) => (
        i % labelStep === 0 || i === pointCount - 1 ? (
          <text key={i} x={scaleX(i)} y={PADDING.top + CHART_H + 16} textAnchor="middle" fontSize={9} fill="#555" transform={`rotate(-30, ${scaleX(i)}, ${PADDING.top + CHART_H + 16})`}>
            {d.label}
          </text>
        ) : null
      ))}

      {/* Ideal line */}
      {idealLine && <path d={idealLine} fill="none" stroke="#95a5a6" strokeWidth={2} strokeDasharray="6,3" />}

      {/* Actual line */}
      {actualLine && <path d={actualLine} fill="none" stroke="#e74c3c" strokeWidth={2.5} />}

      {/* Data points for actual */}
      {data.map((d, i) => (
        <circle key={i} cx={scaleX(i)} cy={scaleY(d.actual)} r={3} fill="#e74c3c" />
      ))}

      {/* Legend */}
      <line x1={PADDING.left + 10} y1={12} x2={PADDING.left + 30} y2={12} stroke="#95a5a6" strokeWidth={2} strokeDasharray="6,3" />
      <text x={PADDING.left + 34} y={16} fontSize={10} fill="#555">Ideal</text>
      <line x1={PADDING.left + 80} y1={12} x2={PADDING.left + 100} y2={12} stroke="#e74c3c" strokeWidth={2.5} />
      <text x={PADDING.left + 104} y={16} fontSize={10} fill="#555">Actual</text>
    </svg>
  );
});

BurnDownChart.displayName = 'BurnDownChart';
