import React from 'react';
import type { FieldError, FieldValues, Path, UseFormRegister } from 'react-hook-form';

interface FormFieldProps<T extends FieldValues> {
  label: string;
  name: Path<T>;
  register: UseFormRegister<T>;
  error?: FieldError;
  type?: 'text' | 'email' | 'password' | 'tel' | 'number' | 'url';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  className?: string;
}

export function FormField<T extends FieldValues>({
  label,
  name,
  register,
  error,
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
  autoComplete,
  className = '',
}: FormFieldProps<T>) {
  const inputId = `field-${String(name)}`;

  return (
    <div className={`space-y-1 ${className}`}>
      <label
        htmlFor={inputId}
        className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        id={inputId}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors
          bg-white/50 dark:bg-slate-700/50
          ${
            error
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
              : 'border-slate-300 dark:border-slate-600'
          }
          ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''}
        `}
        {...register(name)}
      />
      {error && (
        <p
          id={`${inputId}-error`}
          className="text-sm text-red-500 flex items-center gap-1"
          role="alert"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error.message}
        </p>
      )}
    </div>
  );
}

interface TextAreaFieldProps<T extends FieldValues> {
  label: string;
  name: Path<T>;
  register: UseFormRegister<T>;
  error?: FieldError;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  maxLength?: number;
  className?: string;
}

export function TextAreaField<T extends FieldValues>({
  label,
  name,
  register,
  error,
  placeholder,
  required = false,
  disabled = false,
  rows = 4,
  maxLength,
  className = '',
}: TextAreaFieldProps<T>) {
  const inputId = `field-${String(name)}`;

  return (
    <div className={`space-y-1 ${className}`}>
      <label
        htmlFor={inputId}
        className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <textarea
        id={inputId}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none
          bg-white/50 dark:bg-slate-700/50
          ${
            error
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
              : 'border-slate-300 dark:border-slate-600'
          }
          ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''}
        `}
        {...register(name)}
      />
      {error && (
        <p
          id={`${inputId}-error`}
          className="text-sm text-red-500 flex items-center gap-1"
          role="alert"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error.message}
        </p>
      )}
    </div>
  );
}

interface SelectFieldProps<T extends FieldValues> {
  label: string;
  name: Path<T>;
  register: UseFormRegister<T>;
  error?: FieldError;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function SelectField<T extends FieldValues>({
  label,
  name,
  register,
  error,
  options,
  placeholder = 'Select an option',
  required = false,
  disabled = false,
  className = '',
}: SelectFieldProps<T>) {
  const inputId = `field-${String(name)}`;

  return (
    <div className={`space-y-1 ${className}`}>
      <label
        htmlFor={inputId}
        className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        id={inputId}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors
          bg-white/50 dark:bg-slate-700/50 appearance-none cursor-pointer
          ${
            error
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
              : 'border-slate-300 dark:border-slate-600'
          }
          ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''}
        `}
        {...register(name)}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p
          id={`${inputId}-error`}
          className="text-sm text-red-500 flex items-center gap-1"
          role="alert"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error.message}
        </p>
      )}
    </div>
  );
}

interface CheckboxFieldProps<T extends FieldValues> {
  label: string | React.ReactNode;
  name: Path<T>;
  register: UseFormRegister<T>;
  error?: FieldError;
  disabled?: boolean;
  className?: string;
}

export function CheckboxField<T extends FieldValues>({
  label,
  name,
  register,
  error,
  disabled = false,
  className = '',
}: CheckboxFieldProps<T>) {
  const inputId = `field-${String(name)}`;

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-start gap-3">
        <input
          id={inputId}
          type="checkbox"
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={`mt-1 w-5 h-5 rounded border-slate-300 dark:border-slate-600 
            text-orange-500 focus:ring-orange-500 cursor-pointer
            ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
          `}
          {...register(name)}
        />
        <label
          htmlFor={inputId}
          className="text-sm text-slate-700 dark:text-slate-200 cursor-pointer"
        >
          {label}
        </label>
      </div>
      {error && (
        <p
          id={`${inputId}-error`}
          className="text-sm text-red-500 flex items-center gap-1"
          role="alert"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error.message}
        </p>
      )}
    </div>
  );
}

// Form submit button with loading state
interface SubmitButtonProps {
  children: React.ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({
  children,
  isLoading = false,
  disabled = false,
  className = '',
}) => {
  return (
    <button
      type="submit"
      disabled={isLoading || disabled}
      className={`w-full py-3 px-6 rounded-lg font-bold text-white transition-all duration-200
        bg-orange-500 hover:bg-orange-600 focus:ring-4 focus:ring-orange-300
        disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-orange-500
        active:scale-[0.98] ${className}
      `}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Processing...
        </span>
      ) : (
        children
      )}
    </button>
  );
};

// Form error summary component
interface FormErrorSummaryProps {
  errors: Record<string, FieldError | undefined>;
}

export const FormErrorSummary: React.FC<FormErrorSummaryProps> = ({ errors }) => {
  const errorList = Object.entries(errors).filter(([, error]) => error);

  if (errorList.length === 0) return null;

  return (
    <div
      className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3">
        <svg
          className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
        <div>
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
            Please fix the following errors:
          </h3>
          <ul className="mt-2 text-sm text-red-700 dark:text-red-300 list-disc list-inside">
            {errorList.map(([field, error]) => (
              <li key={field}>{error?.message}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
