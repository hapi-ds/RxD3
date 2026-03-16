/**
 * TaskListTable component for Classic Project View.
 * Displays task ID, name (indented by hierarchy level), duration, and task_type.
 *
 * Requirements: 4.9
 */

import React from 'react';
import type { ScheduledTaskEnriched } from '../../types';

interface TaskListTableProps {
  tasks: ScheduledTaskEnriched[];
  maxDepth: number;
}

export const TaskListTable: React.FC<TaskListTableProps> = React.memo(({ tasks, maxDepth }) => {
  const filtered = tasks.filter(t => (t.hierarchy_level ?? 0) <= maxDepth);

  return (
    <table className="task-list-table" role="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Task</th>
          <th>Duration</th>
          <th>Type</th>
        </tr>
      </thead>
      <tbody>
        {filtered.map((t, i) => (
          <tr key={t.uuid} className={t.is_critical ? 'critical-row' : ''}>
            <td>{i + 1}</td>
            <td style={{ paddingLeft: `${(t.hierarchy_level ?? 0) * 16 + 8}px` }}>
              {t.task_title}
            </td>
            <td>{t.scheduled_duration?.toFixed(1)}d</td>
            <td>{t.task_type}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
});

TaskListTable.displayName = 'TaskListTable';
