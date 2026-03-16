/**
 * SprintTaskList component for Agile Project View.
 * Three sections: Backlog, Current Sprint, Next Sprint.
 * Each task shows title, status, priority, assigned resources, effort.
 * Resources are resolved via ASSIGNED_TO relationships (with inheritance).
 *
 * Requirements: 5.3, 5.4, 5.5
 */

import React from 'react';

interface SprintTask {
  uuid: string;
  title: string;
  status: string;
  priority: string;
  assignedResources: string[];
  effort: number | null;
}

interface SprintSection {
  label: string;
  tasks: SprintTask[];
}

interface SprintTaskListProps {
  backlog: SprintTask[];
  currentSprint: { label: string; tasks: SprintTask[] } | null;
  nextSprint: { label: string; tasks: SprintTask[] } | null;
}

const TaskRow: React.FC<{ task: SprintTask }> = ({ task }) => (
  <tr>
    <td>{task.title}</td>
    <td><span className={`status-badge status-${task.status}`}>{task.status}</span></td>
    <td><span className={`priority-badge priority-${task.priority}`}>{task.priority}</span></td>
    <td>{task.assignedResources.length > 0 ? task.assignedResources.join(', ') : '—'}</td>
    <td>{task.effort != null ? `${task.effort}h` : '—'}</td>
  </tr>
);

const SectionTable: React.FC<{ section: SprintSection }> = ({ section }) => (
  <div className="sprint-section">
    <h4>{section.label}</h4>
    {section.tasks.length === 0 ? (
      <p className="sprint-empty">No tasks in this section.</p>
    ) : (
      <table className="sprint-task-table" role="table">
        <thead>
          <tr>
            <th>Task</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Resources</th>
            <th>Effort</th>
          </tr>
        </thead>
        <tbody>
          {section.tasks.map(t => <TaskRow key={t.uuid} task={t} />)}
        </tbody>
      </table>
    )}
  </div>
);

export const SprintTaskList: React.FC<SprintTaskListProps> = React.memo(({
  backlog, currentSprint, nextSprint,
}) => {
  return (
    <div className="sprint-task-list">
      {currentSprint && <SectionTable section={currentSprint} />}
      {nextSprint && <SectionTable section={nextSprint} />}
      <SectionTable section={{ label: 'Backlog', tasks: backlog }} />
    </div>
  );
});

SprintTaskList.displayName = 'SprintTaskList';

export type { SprintTask };
