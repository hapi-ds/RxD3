/**
 * TextInput Component
 * Reusable text input with validation support
 * 
 * **Validates: Requirements 4.5, 4.6**
 */

import { useState, useEffect } from 'react';
import './FormInputs.css';

export interface TextInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  readonly?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  placeholder?: string;
  helpText?: string;
  multiline?: boolean;
}

export function TextInput({
  id,
  label,
  value,
  onChange,
  required = false,
  readonly = false,
  minLength,
  maxLength,
  pattern,
  placeholder,
  helpText,
  multiline = false,
}: TextInputProps) {
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!touched) return;
    validateInput(value);
  }, [value, touched]);

  const validateInput = (val: string) => {
    if (required && !val) {
      setError('This field is required');
      return false;
    }

    if (minLength && val.length < minLength) {
      setError(`Minimum length is ${minLength} characters`);
      return false;
    }

    if (maxLength && val.length > maxLength) {
      setError(`Maximum length is ${maxLength} characters`);
      return false;
    }

    if (pattern && val && !new RegExp(pattern).test(val)) {
      setError('Invalid format');
      return false;
    }

    setError(null);
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleBlur = () => {
    setTouched(true);
    validateInput(value);
  };

  const InputElement = multiline ? 'textarea' : 'input';

  return (
    <div className="form-input-wrapper">
      <label className="form-label" htmlFor={id}>
        {label}
        {required && <span className="required-indicator">*</span>}
      </label>
      <InputElement
        id={id}
        className={`form-control ${error ? 'error' : ''}`}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={readonly}
        readOnly={readonly}
        placeholder={placeholder}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
        {...(multiline ? { rows: 4 } : { type: 'text' })}
      />
      {error && touched && <span className="error-message" id={`${id}-error`} role="alert">{error}</span>}
      {helpText && !error && <span className="help-text" id={`${id}-help`}>{helpText}</span>}
    </div>
  );
}
