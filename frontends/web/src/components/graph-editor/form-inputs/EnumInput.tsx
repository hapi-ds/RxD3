/**
 * EnumInput Component
 * Reusable select/dropdown input for enum values with validation support
 * 
 * **Validates: Requirements 4.5, 4.6**
 */

import { useState, useEffect } from 'react';
import './FormInputs.css';

export interface EnumInputProps {
  id: string;
  label: string;
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  options: string[];
  required?: boolean;
  readonly?: boolean;
  placeholder?: string;
  helpText?: string;
}

export function EnumInput({
  id,
  label,
  value,
  onChange,
  options,
  required = false,
  readonly = false,
  placeholder = 'Select...',
  helpText,
}: EnumInputProps) {
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!touched) return;
    validateInput(value);
  }, [value, touched]);

  const validateInput = (val: string | null | undefined) => {
    if (required && !val) {
      setError('This field is required');
      return false;
    }

    if (val && !options.includes(val)) {
      setError('Invalid selection');
      return false;
    }

    setError(null);
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onChange(val === '' ? null : val);
  };

  const handleBlur = () => {
    setTouched(true);
    validateInput(value);
  };

  // Format enum value for display (e.g., "USER_STORY" -> "User Story")
  const formatLabel = (str: string): string => {
    return str
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className="form-input-wrapper">
      <label className="form-label" htmlFor={id}>
        {label}
        {required && <span className="required-indicator">*</span>}
      </label>
      <select
        id={id}
        className={`form-control ${error ? 'error' : ''}`}
        value={value ?? ''}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={readonly}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt} value={opt}>
            {formatLabel(opt)}
          </option>
        ))}
      </select>
      {error && touched && <span className="error-message" id={`${id}-error`} role="alert">{error}</span>}
      {helpText && !error && <span className="help-text" id={`${id}-help`}>{helpText}</span>}
    </div>
  );
}
