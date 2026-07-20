'use client';

import { FieldShell } from './FieldShell';
import { Input } from '@/components/ui/input';
import { Controller, useFormContext } from 'react-hook-form'

interface RHFTextFieldProps {
  name: string;
  label?: string;
  required?: boolean;
  tooltip?: string;
  placeholder?: string;
  helperText?: React.ReactNode;
  type?: 'text' | 'number' | 'email' | 'password';
  disabled?: boolean;
  min?: number;
  /** Fixed left-side chip (e.g. "USD", "%"). */
  prefix?: string;
  fullWidth?: boolean;
  className?: string;
  labelClassName?: string;
}

const PREFIX_CHIP =
  'inline-flex h-11 shrink-0 select-none items-center rounded-l-lg border border-r-0 border-input bg-muted px-3 text-xs font-semibold text-foreground dark:bg-muted/50';

function RHFTextField({
  name,
  label,
  required,
  tooltip,
  placeholder,
  helperText,
  type = 'text',
  disabled,
  min,
  prefix,
  fullWidth,
  className,
  labelClassName,
}: RHFTextFieldProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const inputEl = (
          <Input
            type={type}
            value={field.value ?? ''}
            placeholder={placeholder}
            onChange={field.onChange}
            onBlur={field.onBlur}
            disabled={disabled}
            min={min}
            aria-invalid={!!error}
            className={`h-11 ${prefix ? "rounded-l-none border-l-0" : ""}`}
          />
        );

        return (
          <FieldShell
            label={label}
            required={required}
            tooltip={tooltip}
            error={error?.message}
            helperText={helperText}
            fullWidth={fullWidth}
            className={className}
            labelClassName={labelClassName}
          >
            {prefix ? (
              <div className="flex items-stretch">
                <span className={PREFIX_CHIP} aria-hidden>
                  {prefix}
                </span>
                <div className="flex-1 min-w-0">{inputEl}</div>
              </div>
            ) : (
              inputEl
            )}
          </FieldShell>
        );
      }}
    />
  );
}

export { RHFTextField };
