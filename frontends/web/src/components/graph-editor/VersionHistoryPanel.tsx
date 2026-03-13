/**
 * VersionHistoryPanel Component
 * Displays version history for the selected node
 * 
 * Features:
 * - Fixed 300px width on left side
 * - Fetches all versions when a node is selected
 * - Displays versions in reverse chronological order (newest first)
 * - Highlights the current version (highest version number)
 * - Shows version number, updated_at timestamp, and creator
 * 
 * Requirements: 1.3, 6.1, 6.2, 6.3
 */

import { useEffect, useState } from 'react';
import { useGraphEditor } from './GraphEditorContext';
import { mindsAPI } from '../../services/api';
import { Spinner } from './LoadingSkeleton';
import type { Mind } from '../../types/generated';
import './VersionHistoryPanel.css';

/**
 * Format timestamp as relative time (e.g., "2 hours ago", "3 days ago")
 */
function formatRelativeTime(timestamp: string | undefined): string {
  if (!timestamp) return 'Unknown';
  
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);
    
    if (diffSeconds < 60) {
      return diffSeconds === 1 ? '1 second ago' : `${diffSeconds} seconds ago`;
    } else if (diffMinutes < 60) {
      return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    } else if (diffDays < 7) {
      return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
    } else if (diffWeeks < 4) {
      return diffWeeks === 1 ? '1 week ago' : `${diffWeeks} weeks ago`;
    } else if (diffMonths < 12) {
      return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
    } else {
      return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
    }
  } catch {
    return timestamp;
  }
}

/**
 * Format a value for display in the version detail view
 */
function formatAttributeValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'N/A';
  }
  
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : 'Empty';
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  return String(value);
}

/**
 * VersionHistoryPanel Component
 * Displays version history for the selected node in a permanent left panel
 */
export function VersionHistoryPanel() {
  const { state } = useGraphEditor();
  const { selectedNodeId } = state.selection;
  
  const [versions, setVersions] = useState<Mind[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedVersionId, setExpandedVersionId] = useState<string | null>(null);

  // Fetch versions when a node is selected
  useEffect(() => {
    if (!selectedNodeId) {
      setVersions([]);
      setError(null);
      setExpandedVersionId(null);
      return;
    }

    const fetchVersions = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const fetchedVersions = await mindsAPI.getVersions(selectedNodeId);
        
        // Sort versions in reverse chronological order (newest first)
        const sortedVersions = [...fetchedVersions].sort((a, b) => {
          const versionA = a.version ?? 0;
          const versionB = b.version ?? 0;
          return versionB - versionA;
        });
        
        setVersions(sortedVersions);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch versions';
        setError(errorMessage);
        setVersions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVersions();
  }, [selectedNodeId]);

  // Find the current version (highest version number)
  const currentVersion = versions.length > 0 
    ? Math.max(...versions.map(v => v.version ?? 0))
    : null;

  // Format timestamp for display
  const formatTimestamp = (timestamp: string | undefined): string => {
    if (!timestamp) return 'Unknown';
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return timestamp;
    }
  };

  // Toggle expand/collapse for a version
  const toggleVersionExpand = (versionId: string) => {
    setExpandedVersionId(expandedVersionId === versionId ? null : versionId);
  };

  // Get all attributes of a version for display
  const getVersionAttributes = (version: Mind): Array<{ key: string; value: unknown }> => {
    const attributes: Array<{ key: string; value: unknown }> = [];
    
    // Get all keys from the version object
    const keys = Object.keys(version) as Array<keyof Mind>;
    
    // Sort keys to show important ones first
    const priorityKeys = ['uuid', 'title', '__primarylabel__', 'version', 'created_at', 'updated_at', 'creator', 'status', 'description'];
    const sortedKeys = [
      ...keys.filter(k => priorityKeys.includes(k as string)),
      ...keys.filter(k => !priorityKeys.includes(k as string))
    ];
    
    for (const key of sortedKeys) {
      attributes.push({ key: String(key), value: version[key] });
    }
    
    return attributes;
  };

  // Render empty state when no node is selected
  if (!selectedNodeId) {
    return (
      <div className="version-history-panel" role="region" aria-label="Version History">
        <div className="version-history-header">
          <h2>Version History</h2>
        </div>
        <div className="version-history-empty">
          <p>Select a node to view its version history</p>
        </div>
      </div>
    );
  }

  // Render loading state
  if (loading) {
    return (
      <div className="version-history-panel" role="region" aria-label="Version History">
        <div className="version-history-header">
          <h2>Version History</h2>
        </div>
        <div className="version-history-loading" role="status" aria-live="polite">
          <Spinner size="medium" label="Loading versions" />
          <p>Loading versions...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="version-history-panel" role="region" aria-label="Version History">
        <div className="version-history-header">
          <h2>Version History</h2>
        </div>
        <div className="version-history-error" role="alert">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  // Render versions list
  return (
    <div className="version-history-panel" role="region" aria-label="Version History">
      <div className="version-history-header">
        <h2>Version History</h2>
        <span className="version-count" role="status" aria-live="polite">
          {versions.length} version{versions.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="version-history-list" role="list" aria-label="Version history list">
        {versions.map((version) => {
          const versionNumber = version.version ?? 0;
          const isCurrent = versionNumber === currentVersion;
          const versionId = `${version.uuid}-v${versionNumber}`;
          const isExpanded = expandedVersionId === versionId;
          
          return (
            <div
              key={versionId}
              className={`version-item ${isCurrent ? 'current-version' : ''} ${isExpanded ? 'expanded' : ''}`}
              role="listitem"
            >
              <div 
                className="version-header"
                onClick={() => toggleVersionExpand(versionId)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleVersionExpand(versionId);
                  }
                }}
                aria-expanded={isExpanded}
                aria-label={`Version ${versionNumber}, click to ${isExpanded ? 'collapse' : 'expand'} details`}
              >
                <span className="version-number">
                  <span className="expand-icon" aria-hidden="true">{isExpanded ? '▼' : '▶'}</span>
                  v{versionNumber}
                  {isCurrent && <span className="current-badge" role="status">Current</span>}
                </span>
              </div>
              
              <div className="version-details">
                <div className="version-detail-row">
                  <span className="version-label">Updated:</span>
                  <span className="version-value" title={formatTimestamp(version.updated_at)}>
                    {formatRelativeTime(version.updated_at)}
                  </span>
                </div>
                
                <div className="version-detail-row">
                  <span className="version-label">Creator:</span>
                  <span className="version-value">{version.creator}</span>
                </div>
              </div>
              
              {isExpanded && (
                <div className="version-expanded-details" role="region" aria-label={`Version ${versionNumber} details`}>
                  <div className="expanded-details-header">All Attributes</div>
                  <div className="expanded-details-content">
                    {getVersionAttributes(version).map(({ key, value }) => (
                      <div key={key} className="expanded-detail-row">
                        <span className="expanded-detail-label">{key}:</span>
                        <span className="expanded-detail-value">{formatAttributeValue(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
