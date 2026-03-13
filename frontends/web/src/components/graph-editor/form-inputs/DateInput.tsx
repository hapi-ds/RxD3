/**
 * DateInput Component
 * Reusable date input with validation support
 * 
 * **Validates: Requirements 4.5, 4.6**
 */

import { useState, useEffect } from 'react';
import './FormInputs.css';

export interface DateInputProps {
  id: string;
  label: string;
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  required?: boolean;
  readonly?: boolean;
  min?: string;
  max?: string;
  placeholder?: string;
  helpText?: string;
}

export function DateInput({
  id,
  label,
  value,
  onChange,
  required = false,
  readonly = false,
  min,
  max,
  placeholder,
  helpText,
}: DateInputProps) {
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  // Format ISO datetime to date input format (YYYY-MM-DD)
  const formatDateForInput = (val: string | null | undefined): string => {
    if (!val) return '';
    try {
      const date = new Date(val);
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const [inputValue, setInputValue] = useState(formatDateForInput(value));

  useEffect(() => {
    setInputValue(formatDateForInput(value));
  }, [value]);

  useEffect(() => {
    if (!touched) return;
    validateInput(inputValue);
  }, [inputValue, touched]);

  const validateInput = (val: string) => {
    if (required && !val) {
      setError('This field is required');
      return false;
    }

    if (val && min && val < min) {
      setError(`Date must be after ${min}`);
      return false;
    }

    if (val && max && val > max) {
      setError(`Date must be before ${max}`);
      return false;
    }

    setError(null);
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    
    if (val === '') {
      onChange(null);
    } else {
      // Convert to ISO 8601 format for backend
      onChange(val);
    }
  };

  const handleBlur = () => {
    setTouched(true);
    validateInput(inputValue);
  };

  return (
    <div className="form-input-wrapper">
      <label className="form-label" htmlFor={id}>
        {label}
        {required && <span className="required-indicator">*</span>}
      </label>
      <input
        id={id}
        type="date"
        className={`form-control ${error ? 'error' : ''}`}
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={readonly}
        readOnly={readonly}
        min={min}
        max={max}
        placeholder={placeholder}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
      />
      {error && touched && <span className="error-message" id={`${id}-error`} role="alert">{error}</span>}
      {helpText && !error && <span className="help-text" id={`${id}-help`}>{helpText}</span>}
    </div>
  );
}
