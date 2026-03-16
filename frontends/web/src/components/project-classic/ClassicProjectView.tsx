/**
 * ClassicProjectView page component.
 * Fetches schedule data and composes GanttChart, TaskListTable, ScheduleControls,
 * and "Download Report" button.
 *
 * Requirements: 4.1, 4.8, 4.10, 4.11
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { schedulesAPI, reportsAPI, mindsAPI } from '../../services/api';
import type { ScheduleHistory, ScheduledTaskEnriched, GanttChartProps } from '../../types';
import type { Mind } from '../../types/generated';
import { GanttChart } from './GanttChart';
import { TaskListTable } from './TaskListTable';
import { ScheduleControls } from './ScheduleControls';
import './ClassicProjectView.css';

export const ClassicProjectView: React.FC = () => {
  const { projectUuid } = useParams<{ projectUuid: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [versions, setVersions] = useState<ScheduleHistory[]>([]);
  const [tasks, setTasks] = useState<ScheduledTaskEnriched[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number>(0);
  const [timeScale, setTimeScale] = useState<GanttChartProps['timeScale']>('months');
  const [maxDepth, setMaxDepth] = useState(3);
  const [scheduling, setScheduling] = useState(false);
  const [projects, setProjects] = useState<Mind[]>([]);

  // When no projectUuid, load project list for selector
  useEffect(() => {
    if (!projectUuid) {
      setLoading(true);
      mindsAPI.list().then(allMinds => {
        const projectMinds = allMinds.filter(m => {
          const raw = m as unknown as Record<string, unknown>;
          const mt = String(raw.mind_type ?? raw.__primarylabel__ ?? '').toLowerCase();
          return mt === 'project';
        });
        setProjects(projectMinds);
        setLoading(false);
      }).catch(() => {
        setError('Failed to load projects.');
        setLoading(false);
      });
    }
  }, [projectUuid]);

  const fetchData = useCallback(async (version?: number) => {
    if (!projectUuid) return;
    setLoading(true);
    setError(null);
    try {
      const history = await schedulesAPI.getHistory(projectUuid);
      setVersions(history);
      if (history.length > 0) {
        const ver = version ?? history[0].version;
        setSelectedVersion(ver);
        const scheduledTasks = await schedulesAPI.getTasks(projectUuid, ver);
        setTasks(scheduledTasks);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load schedule data';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [projectUuid]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleVersionChange = useCallback((ver: number) => {
    setSelectedVersion(ver);
    fetchData(ver);
  }, [fetchData]);

  const handleRunScheduler = useCallback(async () => {
    if (!projectUuid) return;
    setScheduling(true);
    try {
      await schedulesAPI.createSchedule(projectUuid);
      await fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Scheduling failed';
      setError(msg);
    } finally {
      setScheduling(false);
    }
  }, [projectUuid, fetchData]);

  const handleDownloadPDF = useCallback(async () => {
    if (!projectUuid) return;
    try {
      const blob = await reportsAPI.downloadPDF(projectUuid, selectedVersion || undefined, timeScale);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project_report_v${selectedVersion}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'PDF download failed';
      setError(msg);
    }
  }, [projectUuid, selectedVersion, timeScale]);

  if (loading) {
    return <div className="classic-view-loading">Loading schedule data...</div>;
  }

  // Show project selector when no projectUuid
  if (!projectUuid) {
    return (
      <div className="classic-view-select-project">
        <h2>Classic Project View</h2>
        {error && <p className="error-message">{error}</p>}
        {projects.length === 0 ? (
          <p>No projects found. Create a project first.</p>
        ) : (
          <div className="project-selector">
            <label>
              Select a project:
              <select
                onChange={e => navigate(`/project-classic/${e.target.value}`)}
                defaultValue=""
              >
                <option value="" disabled>-- Choose a project --</option>
                {projects.map(p => (
                  <option key={String(p.uuid)} value={String(p.uuid)}>{p.title}</option>
                ))}
              </select>
            </label>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="classic-view-error">
        <p>{error}</p>
        <button onClick={() => fetchData()}>Retry</button>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="classic-view-empty">
        <p>No schedule history found for this project.</p>
        <p>Run the scheduler to generate a schedule.</p>
        <button onClick={handleRunScheduler} disabled={scheduling}>
          {scheduling ? 'Scheduling...' : 'Run Scheduler'}
        </button>
      </div>
    );
  }

  const currentHistory = versions.find(v => v.version === selectedVersion);

  return (
    <div className="classic-project-view">
      <div className="classic-view-header">
        <h2>Classic Project View</h2>
        <div className="classic-view-actions">
          <ScheduleControls
            versions={versions}
            selectedVersion={selectedVersion}
            onVersionChange={handleVersionChange}
            timeScale={timeScale}
            onTimeScaleChange={setTimeScale}
            maxDepth={maxDepth}
            onMaxDepthChange={setMaxDepth}
          />
          <button onClick={handleRunScheduler} disabled={scheduling} className="reschedule-btn">
            {scheduling ? 'Scheduling...' : 'Reschedule'}
          </button>
          <button onClick={handleDownloadPDF} className="download-btn">
            Download Report
          </button>
        </div>
      </div>

      <div className="classic-view-content">
        <div className="task-list-panel">
          <TaskListTable tasks={tasks} maxDepth={maxDepth} />
        </div>
        <div className="gantt-panel">
          {currentHistory && (
            <GanttChart
              tasks={tasks}
              timeScale={timeScale}
              maxDepth={maxDepth}
              globalStart={currentHistory.global_start ?? new Date().toISOString()}
              globalEnd={currentHistory.global_end ?? new Date().toISOString()}
            />
          )}
        </div>
      </div>
    </div>
  );
};
