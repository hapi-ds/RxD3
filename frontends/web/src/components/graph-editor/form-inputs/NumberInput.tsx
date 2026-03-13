/**
 * NumberInput Component
 * Reusable number input with validation support
 * 
 * **Validates: Requirements 4.5, 4.6**
 */

import { useState, useEffect } from 'react';
import './FormInputs.css';

export interface NumberInputProps {
  id: string;
  label: string;
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  required?: boolean;
  readonly?: boolean;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  helpText?: string;
}

export function NumberInput({
  id,
  label,
  value,
  onChange,
  required = false,
  readonly = false,
  min,
  max,
  step,
  placeholder,
  helpText,
}: NumberInputProps) {
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [inputValue, setInputValue] = useState(value?.toString() ?? '');

  useEffect(() => {
    setInputValue(value?.toString() ?? '');
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

    if (val && isNaN(Number(val))) {
      setError('Must be a valid number');
      return false;
    }

    const numVal = Number(val);

    if (val && min !== undefined && numVal < min) {
      setError(`Minimum value is ${min}`);
      return false;
    }

    if (val && max !== undefined && numVal > max) {
      setError(`Maximum value is ${max}`);
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
    } else if (!isNaN(Number(val))) {
      onChange(Number(val));
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
        type="number"
        className={`form-control ${error ? 'error' : ''}`}
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={readonly}
        readOnly={readonly}
        min={min}
        max={max}
        step={step}
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
