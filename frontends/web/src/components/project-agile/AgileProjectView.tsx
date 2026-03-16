/**
 * AgileProjectView page component.
 * Fetches Sprint nodes and Tasks, composes BurnDownChart and SprintTaskList.
 * Resolves assigned resources via ASSIGNED_TO relationships with implicit
 * inheritance through the CONTAINS hierarchy.
 *
 * Requirements: 5.1, 5.7, 5.8
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mindsAPI, relationshipsAPI } from '../../services/api';
import type { Mind } from '../../types/generated';
import type { Relationship } from '../../types';
import { BurnDownChart, type BurnDownDataPoint } from './BurnDownChart';
import { SprintTaskList } from './SprintTaskList';
import type { SprintTask } from './SprintTaskList';
import './AgileProjectView.css';

interface SprintInfo {
  uuid: string;
  title: string;
  start_date: string;
  end_date: string;
  velocity: number | null;  // hours per week
  tasks: SprintTask[];
}

interface BookingInfo {
  taskUuid: string;
  hours: number;
  date: string;
}

/**
 * Resolve assigned resources for a task by walking up the CONTAINS hierarchy.
 */
function resolveAssignedResources(
  taskUuid: string,
  allRels: Relationship[],
  allMindMap: Map<string, Mind>,
): string[] {
  const parentMap = new Map<string, string[]>();
  for (const rel of allRels) {
    if (rel.type === 'CONTAINS') {
      const parents = parentMap.get(rel.target) ?? [];
      parents.push(rel.source);
      parentMap.set(rel.target, parents);
    }
  }

  const assignedToMap = new Map<string, string[]>();
  for (const rel of allRels) {
    if (rel.type === 'ASSIGNED_TO') {
      const existing = assignedToMap.get(rel.target) ?? [];
      const resourceMind = allMindMap.get(rel.source);
      const name = resourceMind ? resourceMind.title : rel.source;
      if (!existing.includes(name)) {
        existing.push(name);
      }
      assignedToMap.set(rel.target, existing);
    }
  }

  const direct = assignedToMap.get(taskUuid);
  if (direct && direct.length > 0) return direct;

  const visited = new Set<string>([taskUuid]);
  let queue = parentMap.get(taskUuid) ?? [];
  while (queue.length > 0) {
    const nextQueue: string[] = [];
    for (const parentUuid of queue) {
      if (visited.has(parentUuid)) continue;
      visited.add(parentUuid);
      const parentResources = assignedToMap.get(parentUuid);
      if (parentResources && parentResources.length > 0) return parentResources;
      const grandparents = parentMap.get(parentUuid) ?? [];
      nextQueue.push(...grandparents);
    }
    queue = nextQueue;
  }
  return [];
}

export const AgileProjectView: React.FC = () => {
  const { projectUuid } = useParams<{ projectUuid: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Mind[]>([]);
  
  // Data state
  const [sprints, setSprints] = useState<SprintInfo[]>([]);
  const [backlogTasks, setBacklogTasks] = useState<SprintTask[]>([]);
  const [bookings, setBookings] = useState<BookingInfo[]>([]);
  const [projectStartDate, setProjectStartDate] = useState<string>('');
  
  // Burn-down scope selector
  const [burnDownScope, setBurnDownScope] = useState<string>('project');

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

  const fetchData = useCallback(async () => {
    if (!projectUuid) return;
    setLoading(true);
    setError(null);
    try {
      const [allMinds, allRels] = await Promise.all([
        mindsAPI.list(),
        relationshipsAPI.list(),
      ]);

      const allMindMap = new Map(allMinds.map(m => [String(m.uuid), m]));
      
      // Get project info
      const projectMind = allMindMap.get(projectUuid);
      const projectRaw = projectMind as unknown as Record<string, unknown> | undefined;
      setProjectStartDate(String(projectRaw?.start_date ?? ''));

      const toSprintTask = (m: Mind): SprintTask => {
        const raw = m as unknown as Record<string, unknown>;
        return {
          uuid: String(m.uuid),
          title: m.title,
          status: String(m.status ?? 'draft'),
          priority: String(raw.priority ?? 'medium'),
          assignedResources: resolveAssignedResources(String(m.uuid), allRels, allMindMap),
          effort: (raw.effort as number) ?? null,
        };
      };

      // Collect all project task UUIDs
      const projectTaskUuids = new Set<string>();
      const collectProjectTasks = (parentUuid: string): void => {
        for (const rel of allRels) {
          if (rel.source === parentUuid && rel.type === 'CONTAINS') {
            const mind = allMindMap.get(rel.target);
            if (mind) {
              const mindType = String((mind as unknown as Record<string, unknown>).mind_type ?? '').toLowerCase();
              if (mindType === 'task') {
                projectTaskUuids.add(rel.target);
              }
              collectProjectTasks(rel.target);
            }
          }
        }
      };
      collectProjectTasks(projectUuid);

      // Find sprints (direct or indirect)
      const sprintUuids = new Set<string>();
      const projectContains = allRels.filter(r => r.source === projectUuid && r.type === 'CONTAINS');
      for (const rel of projectContains) {
        const mind = allMindMap.get(rel.target);
        if (mind && String((mind as unknown as Record<string, unknown>).mind_type ?? '').toLowerCase().includes('sprint')) {
          sprintUuids.add(rel.target);
        }
      }
      for (const mind of allMinds) {
        const mindType = String((mind as unknown as Record<string, unknown>).mind_type ?? '').toLowerCase();
        if (mindType.includes('sprint')) {
          const sprintUuid = String(mind.uuid);
          for (const rel of allRels) {
            if (rel.source === sprintUuid && rel.type === 'CONTAINS' && projectTaskUuids.has(rel.target)) {
              sprintUuids.add(sprintUuid);
              break;
            }
          }
        }
      }

      // Build sprint info with tasks
      const sprintInfos: SprintInfo[] = [];
      const tasksInSprints = new Set<string>();
      
      for (const sprintUuid of sprintUuids) {
        const sprintMind = allMindMap.get(sprintUuid);
        if (!sprintMind) continue;
        const sprintRaw = sprintMind as unknown as Record<string, unknown>;
        const sprintTasks: SprintTask[] = [];
        
        for (const rel of allRels) {
          if (rel.source === sprintUuid && rel.type === 'CONTAINS') {
            const mind = allMindMap.get(rel.target);
            if (mind) {
              sprintTasks.push(toSprintTask(mind));
              tasksInSprints.add(rel.target);
            }
          }
        }
        
        sprintInfos.push({
          uuid: sprintUuid,
          title: sprintMind.title,
          start_date: String(sprintRaw.start_date ?? ''),
          end_date: String(sprintRaw.end_date ?? ''),
          velocity: (sprintRaw.velocity as number) ?? null,
          tasks: sprintTasks,
        });
      }
      
      // Sort sprints by start_date
      sprintInfos.sort((a, b) => a.start_date.localeCompare(b.start_date));
      setSprints(sprintInfos);

      // Backlog tasks
      const backlog: SprintTask[] = [];
      for (const taskUuid of projectTaskUuids) {
        if (!tasksInSprints.has(taskUuid)) {
          const mind = allMindMap.get(taskUuid);
          if (mind) {
            const raw = mind as unknown as Record<string, unknown>;
            const taskType = String(raw.task_type ?? '').toLowerCase();
            if (taskType === 'task') {
              backlog.push(toSprintTask(mind));
            }
          }
        }
      }
      setBacklogTasks(backlog);

      // Collect bookings linked to project tasks
      const bookingInfos: BookingInfo[] = [];
      for (const mind of allMinds) {
        const mindType = String((mind as unknown as Record<string, unknown>).mind_type ?? '').toLowerCase();
        if (mindType === 'booking') {
          const raw = mind as unknown as Record<string, unknown>;
          const hours = (raw.hours_worked as number) ?? 0;
          const date = String(raw.booking_date ?? raw.created_at ?? '').split('T')[0];
          
          // Find which task this booking is TO
          for (const rel of allRels) {
            if (rel.source === String(mind.uuid) && rel.type === 'TO') {
              if (projectTaskUuids.has(rel.target) || tasksInSprints.has(rel.target)) {
                bookingInfos.push({ taskUuid: rel.target, hours, date });
              }
            }
          }
        }
      }
      setBookings(bookingInfos);
      
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load agile data');
    } finally {
      setLoading(false);
    }
  }, [projectUuid]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Compute burn-down data based on selected scope
  const burnDownData = useMemo((): { data: BurnDownDataPoint[]; totalEffort: number; title: string } => {
    if (burnDownScope === 'project') {
      // Project-level burn-down: across all sprints
      const allTasks = [...sprints.flatMap(s => s.tasks), ...backlogTasks];
      const totalEffort = allTasks.reduce((sum, t) => sum + (t.effort ?? 0), 0);
      
      if (sprints.length === 0) {
        // No sprints - just show start and current
        const bookedTotal = bookings.reduce((sum, b) => sum + b.hours, 0);
        return {
          data: [
            { label: 'Start', date: projectStartDate || '2026-01-01', ideal: totalEffort, actual: totalEffort },
            { label: 'Now', date: new Date().toISOString().split('T')[0], ideal: 0, actual: Math.max(0, totalEffort - bookedTotal) },
          ],
          totalEffort,
          title: 'Project Burn-Down',
        };
      }
      
      // Build data points: start + each sprint end
      const points: BurnDownDataPoint[] = [];
      const startDate = sprints[0]?.start_date || projectStartDate;
      points.push({ label: 'Start', date: startDate, ideal: totalEffort, actual: totalEffort });
      
      let cumulativeBooked = 0;
      const sprintCount = sprints.length;
      
      sprints.forEach((sprint, i) => {
        // Sum bookings up to this sprint's end date
        const sprintBookings = bookings.filter(b => b.date <= sprint.end_date);
        cumulativeBooked = sprintBookings.reduce((sum, b) => sum + b.hours, 0);
        
        const idealRemaining = totalEffort - (totalEffort / sprintCount) * (i + 1);
        const actualRemaining = Math.max(0, totalEffort - cumulativeBooked);
        
        points.push({
          label: `S${i + 1}`,
          date: sprint.end_date,
          ideal: idealRemaining,
          actual: actualRemaining,
        });
      });
      
      return { data: points, totalEffort, title: 'Project Burn-Down' };
      
    } else if (burnDownScope === 'backlog') {
      // Backlog burn-down
      const totalEffort = backlogTasks.reduce((sum, t) => sum + (t.effort ?? 0), 0);
      const backlogTaskUuids = new Set(backlogTasks.map(t => t.uuid));
      const backlogBookings = bookings.filter(b => backlogTaskUuids.has(b.taskUuid));
      const bookedTotal = backlogBookings.reduce((sum, b) => sum + b.hours, 0);
      
      return {
        data: [
          { label: 'Start', date: projectStartDate || '2026-01-01', ideal: totalEffort, actual: totalEffort },
          { label: 'Now', date: new Date().toISOString().split('T')[0], ideal: 0, actual: Math.max(0, totalEffort - bookedTotal) },
        ],
        totalEffort,
        title: 'Backlog Burn-Down',
      };
      
    } else {
      // Individual sprint burn-down
      const sprint = sprints.find(s => s.uuid === burnDownScope);
      if (!sprint) {
        return { data: [], totalEffort: 0, title: 'Sprint Burn-Down' };
      }
      
      const totalEffort = sprint.tasks.reduce((sum, t) => sum + (t.effort ?? 0), 0);
      const sprintTaskUuids = new Set(sprint.tasks.map(t => t.uuid));
      const sprintBookings = bookings
        .filter(b => sprintTaskUuids.has(b.taskUuid) && b.date >= sprint.start_date && b.date <= sprint.end_date)
        .sort((a, b) => a.date.localeCompare(b.date));
      
      // Compute ideal end value using velocity (hours/week)
      const sprintWeeks = Math.max(1, (new Date(sprint.end_date).getTime() - new Date(sprint.start_date).getTime()) / (7 * 86400000));
      const idealBurnedByEnd = sprint.velocity != null ? sprint.velocity * sprintWeeks : totalEffort;
      const idealEnd = Math.max(0, totalEffort - idealBurnedByEnd);
      
      // Show: start point, each unique booking date, and end point
      const points: BurnDownDataPoint[] = [];
      const fmtDate = (d: string): string => {
        const dt = new Date(d);
        return `${dt.getMonth() + 1}/${dt.getDate()}`;
      };
      
      // Start point
      points.push({ label: fmtDate(sprint.start_date), date: sprint.start_date, ideal: totalEffort, actual: totalEffort });
      
      // Group bookings by date and accumulate
      const uniqueDates = [...new Set(sprintBookings.map(b => b.date))];
      let cumulativeBooked = 0;
      
      for (const date of uniqueDates) {
        if (date === sprint.start_date) continue;
        const dayBookings = sprintBookings.filter(b => b.date === date);
        cumulativeBooked += dayBookings.reduce((sum, b) => sum + b.hours, 0);
        
        points.push({
          label: fmtDate(date),
          date,
          ideal: 0, // ignored — chart draws straight line from first to last
          actual: Math.max(0, totalEffort - cumulativeBooked),
        });
      }
      
      // End point (if not already the last booking date)
      const lastDate = points[points.length - 1]?.date;
      if (lastDate !== sprint.end_date) {
        points.push({
          label: fmtDate(sprint.end_date),
          date: sprint.end_date,
          ideal: idealEnd,
          actual: Math.max(0, totalEffort - cumulativeBooked),
        });
      } else {
        // Update the last point's ideal to the velocity-based end value
        points[points.length - 1].ideal = idealEnd;
      }
      
      return { data: points, totalEffort, title: `${sprint.title} Burn-Down` };
    }
  }, [burnDownScope, sprints, backlogTasks, bookings, projectStartDate]);

  // Determine current and next sprint for task list
  const { currentSprint, nextSprint } = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    let currentIdx = -1;
    
    for (let i = 0; i < sprints.length; i++) {
      if (sprints[i].start_date <= today && sprints[i].end_date >= today) {
        currentIdx = i;
        break;
      }
    }
    if (currentIdx === -1 && sprints.length > 0) currentIdx = 0;
    
    const current = currentIdx >= 0 ? {
      label: `Current Sprint: ${sprints[currentIdx].title}`,
      tasks: sprints[currentIdx].tasks,
    } : null;
    
    const next = currentIdx >= 0 && currentIdx + 1 < sprints.length ? {
      label: `Next Sprint: ${sprints[currentIdx + 1].title}`,
      tasks: sprints[currentIdx + 1].tasks,
    } : null;
    
    return { currentSprint: current, nextSprint: next };
  }, [sprints]);

  if (loading) return <div className="agile-view-loading">Loading agile data...</div>;

  if (!projectUuid) {
    return (
      <div className="agile-view-select-project">
        <h2>Agile Project View</h2>
        {error && <p className="error-message">{error}</p>}
        {projects.length === 0 ? (
          <p>No projects found. Create a project first.</p>
        ) : (
          <div className="project-selector">
            <label>
              Select a project:
              <select onChange={e => navigate(`/project-agile/${e.target.value}`)} defaultValue="">
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

  if (error) return <div className="agile-view-error"><p>{error}</p><button onClick={fetchData}>Retry</button></div>;

  return (
    <div className="agile-project-view">
      <h2>Agile Project View</h2>
      <div className="agile-view-content">
        <div className="burndown-panel">
          <div className="burndown-header">
            <h3>Burn-Down Chart</h3>
            <select 
              value={burnDownScope} 
              onChange={e => setBurnDownScope(e.target.value)}
              className="burndown-scope-select"
            >
              <option value="project">Project Overview</option>
              {sprints.map((s, i) => (
                <option key={s.uuid} value={s.uuid}>Sprint {i + 1}: {s.title}</option>
              ))}
              <option value="backlog">Backlog</option>
            </select>
          </div>
          <BurnDownChart 
            data={burnDownData.data} 
            totalEffort={burnDownData.totalEffort} 
            title={burnDownData.title}
          />
        </div>
        <div className="sprint-panel">
          <SprintTaskList backlog={backlogTasks} currentSprint={currentSprint} nextSprint={nextSprint} />
        </div>
      </div>
    </div>
  );
};
