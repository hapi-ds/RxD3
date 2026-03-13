/**
 * ArrayInput Component
 * Reusable array input with validation support
 * Allows adding/removing items from a string array
 * 
 * **Validates: Requirements 4.5, 4.6**
 */

import { useState } from 'react';
import './FormInputs.css';

export interface ArrayInputProps {
  id: string;
  label: string;
  value: string[] | null | undefined;
  onChange: (value: string[] | null) => void;
  required?: boolean;
  readonly?: boolean;
  placeholder?: string;
  helpText?: string;
}

export function ArrayInput({
  id,
  label,
  value,
  onChange,
  required = false,
  readonly = false,
  placeholder = 'Add item...',
  helpText,
}: ArrayInputProps) {
  const [error, setError] = useState<string | null>(null);
  const [newItem, setNewItem] = useState('');
  const items = value ?? [];

  const validateInput = (val: string[] | null | undefined) => {
    if (required && (!val || val.length === 0)) {
      setError('At least one item is required');
      return false;
    }

    setError(null);
    return true;
  };

  const handleAddItem = () => {
    if (!newItem.trim()) return;

    const updatedItems = [...items, newItem.trim()];
    onChange(updatedItems);
    setNewItem('');
    validateInput(updatedItems);
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    onChange(updatedItems.length > 0 ? updatedItems : null);
    validateInput(updatedItems);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddItem();
    }
  };

  return (
    <div className="form-input-wrapper">
      <label className="form-label" htmlFor={id}>
        {label}
        {required && <span className="required-indicator" aria-label="required">*</span>}
      </label>
      
      {!readonly && (
        <div className="array-input-controls">
          <input
            id={id}
            type="text"
            className="form-control"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            aria-label={`Add item to ${label}`}
            aria-describedby={helpText ? `${id}-help` : undefined}
          />
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleAddItem}
            disabled={!newItem.trim()}
            aria-label="Add item to list"
          >
            Add
          </button>
        </div>
      )}

      {items.length > 0 ? (
        <ul className="array-items-list" role="list" aria-label={`${label} items`}>
          {items.map((item, index) => (
            <li key={index} className="array-item" role="listitem">
              <span className="array-item-text">{item}</span>
              {!readonly && (
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => handleRemoveItem(index)}
                  aria-label={`Remove ${item}`}
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="array-empty" role="status">No items</div>
      )}

      {error && <span className="error-message" id={`${id}-error`} role="alert">{error}</span>}
      {helpText && !error && <span className="help-text" id={`${id}-help`}>{helpText}</span>}
    </div>
  );
}
