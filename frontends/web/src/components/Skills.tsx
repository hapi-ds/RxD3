/**
 * Skills Page Component
 * Full CRUD interface for AI Skill nodes with toggle on/off.
 *
 * **Validates: Requirements 9.1–9.15**
 */

import { useState, useEffect, useCallback } from 'react';
import { skillsAPI } from '../services/api';
import type { Skill, SkillDetail, SkillCreate } from '../types';
import './Skills.css';

type ViewMode = 'list' | 'detail' | 'create' | 'edit';

export function Skills(): JSX.Element {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selected, setSelected] = useState<SkillDetail | null>(null);
  const [view, setView] = useState<ViewMode>('list');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formContent, setFormContent] = useState('');

  const loadSkills = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const data = await skillsAPI.list();
      setSkills(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load skills');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  const handleViewDetail = async (uuid: string): Promise<void> => {
    try {
      setActionLoading(true);
      setError(null);
      const detail = await skillsAPI.get(uuid);
      setSelected(detail);
      setView('detail');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load skill');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggle = async (uuid: string): Promise<void> => {
    try {
      setError(null);
      const result = await skillsAPI.toggle(uuid);
      setSkills((prev) =>
        prev.map((s) => (s.uuid === uuid ? { ...s, enabled: result.enabled } : s))
      );
      if (selected && selected.uuid === uuid) {
        setSelected({ ...selected, enabled: result.enabled });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle skill');
    }
  };

  const handleDelete = async (uuid: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this skill?')) return;
    try {
      setActionLoading(true);
      setError(null);
      await skillsAPI.delete(uuid);
      setSkills((prev) => prev.filter((s) => s.uuid !== uuid));
      if (selected?.uuid === uuid) {
        setSelected(null);
        setView('list');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete skill');
    } finally {
      setActionLoading(false);
    }
  };

  const openCreateForm = (): void => {
    setFormName('');
    setFormDescription('');
    setFormContent('');
    setView('create');
    setError(null);
  };

  const openEditForm = (): void => {
    if (!selected) return;
    setFormName(selected.name);
    setFormDescription(selected.description);
    setFormContent(selected.content);
    setView('edit');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const payload: SkillCreate = {
      name: formName.trim(),
      description: formDescription.trim(),
      content: formContent.trim(),
    };
    if (!payload.name || !payload.description || !payload.content) {
      setError('All fields are required.');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      if (view === 'create') {
        await skillsAPI.create(payload);
      } else if (view === 'edit' && selected) {
        await skillsAPI.update(selected.uuid, payload);
      }
      await loadSkills();
      setView('list');
      setSelected(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save skill');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBack = (): void => {
    setView('list');
    setSelected(null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="skills-container">
        <div className="loading">Loading skills…</div>
      </div>
    );
  }

  // Create / Edit form
  if (view === 'create' || view === 'edit') {
    return (
      <div className="skills-container">
        <button onClick={handleBack} className="btn-back">← Back</button>
        <h2>{view === 'create' ? 'New Skill' : 'Edit Skill'}</h2>
        {error && <p className="skills-error">{error}</p>}
        <form onSubmit={handleSubmit} className="skills-form">
          <label htmlFor="skill-name">Name</label>
          <input
            id="skill-name"
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
            maxLength={200}
          />
          <label htmlFor="skill-description">Description</label>
          <input
            id="skill-description"
            type="text"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            required
          />
          <label htmlFor="skill-content">Content</label>
          <textarea
            id="skill-content"
            value={formContent}
            onChange={(e) => setFormContent(e.target.value)}
            required
            rows={10}
          />
          <div className="form-actions">
            <button type="submit" disabled={actionLoading} className="btn-primary">
              {actionLoading ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={handleBack} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Detail view
  if (view === 'detail' && selected) {
    return (
      <div className="skills-container">
        <button onClick={handleBack} className="btn-back">← Back</button>
        <h2>{selected.name}</h2>
        <p className="skill-description">{selected.description}</p>
        <div className="skill-meta">
          <span className={`skill-status ${selected.enabled ? 'enabled' : 'disabled'}`}>
            {selected.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        <div className="skill-content-block">
          <h3>Content</h3>
          <pre>{selected.content}</pre>
        </div>
        {error && <p className="skills-error">{error}</p>}
        <div className="detail-actions">
          <button onClick={openEditForm} disabled={actionLoading} className="btn-primary">Edit</button>
          <button onClick={() => handleToggle(selected.uuid)} disabled={actionLoading} className="btn-secondary">
            {selected.enabled ? 'Disable' : 'Enable'}
          </button>
          <button onClick={() => handleDelete(selected.uuid)} disabled={actionLoading} className="btn-danger">Delete</button>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="skills-container">
      <div className="skills-header">
        <h2>AI Skills</h2>
        <button onClick={openCreateForm} className="btn-primary">New Skill</button>
      </div>
      {error && <p className="skills-error">{error}</p>}
      {skills.length === 0 ? (
        <p className="empty-state">No skills yet. Create your first skill to teach the AI.</p>
      ) : (
        <div className="skills-list">
          {skills.map((skill) => (
            <div key={skill.uuid} className="skill-row">
              <div className="skill-info" onClick={() => handleViewDetail(skill.uuid)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleViewDetail(skill.uuid)}>
                <span className="skill-name">{skill.name}</span>
                <span className="skill-desc">{skill.description}</span>
              </div>
              <label className="toggle-switch" aria-label={`Toggle ${skill.name}`}>
                <input
                  type="checkbox"
                  checked={skill.enabled}
                  onChange={() => handleToggle(skill.uuid)}
                />
                <span className="toggle-slider" />
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
