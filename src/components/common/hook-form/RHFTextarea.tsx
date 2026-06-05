"use client";

import { FieldShell } from "./FieldShell";
import { Textarea } from "@/components/ui/textarea";
import { Controller, useFormContext } from "react-hook-form";

interface RHFTextareaProps {
  name: string;
  label?: string;
  required?: boolean;
  tooltip?: string;
  placeholder?: string;
  helperText?: React.ReactNode;
  disabled?: boolean;
  rows?: number;
  fullWidth?: boolean;
  className?: string;
}

function RHFTextarea({
  name,
  label,
  required,
  tooltip,
  placeholder,
  helperText,
  disabled,
  rows = 4,
  fullWidth,
  className,
}: RHFTextareaProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FieldShell
          label={label}
          required={required}
          tooltip={tooltip}
          error={error?.message}
          helperText={helperText}
          fullWidth={fullWidth}
          className={className}
        >
          <Textarea
            {...field}
            value={field.value ?? ""}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            aria-invalid={!!error}
          />
        </FieldShell>
      )}
    />
  );
}

export { RHFTextarea };
